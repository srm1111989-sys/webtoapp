import json
import hmac
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.build import Build
from app.models.order import Order
from app.models.payment import Payment
from app.models.subscription import Subscription, SubscriptionPayment
from app.config import get_settings
from app.services.build_service import handle_build_webhook
from app.services.subscription_service import handle_subscription_payment
from app.utils.email import send_order_confirmation_email

settings = get_settings()
logger = logging.getLogger("webtoapp.webhooks")
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


# ─── Helper ──────────────────────────────────────────────

async def _find_subscription_by_gateway_id(db: AsyncSession, gateway_id: str) -> Subscription | None:
    """Look up a subscription by its gateway subscription ID."""
    result = await db.execute(
        select(Subscription).where(Subscription.gateway_subscription_id == gateway_id)
    )
    return result.scalar_one_or_none()


# ─── GitLab Webhook ──────────────────────────────────────

@router.post("/gitlab")
async def gitlab_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.headers.get("X-Gitlab-Token")
    if token != settings.gitlab_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    body = await request.json()
    object_kind = body.get("object_kind")

    if object_kind == "pipeline":
        pipeline_id = body.get("object_attributes", {}).get("id")
        pipeline_status = body.get("object_attributes", {}).get("status")

        if pipeline_id:
            await handle_build_webhook(pipeline_id, pipeline_status, body, db)

    return {"status": "ok"}


# ─── GitHub Webhook ──────────────────────────────────────

@router.post("/github")
async def github_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    sig = request.headers.get("X-Hub-Signature-256")
    if not sig and settings.github_webhook_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature")
        
    payload = await request.body()
    
    if settings.github_webhook_secret:
        mac = hmac.new(settings.github_webhook_secret.encode(), msg=payload, digestmod=hashlib.sha256)
        expected_sig = "sha256=" + mac.hexdigest()
        if not hmac.compare_digest(expected_sig, sig):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    event = request.headers.get("X-GitHub-Event")
    
    if event == "workflow_run":
        body = json.loads(payload)
        workflow_run = body.get("workflow_run", {})
        pipeline_id = workflow_run.get("id")
        
        gh_status = workflow_run.get("status")
        conclusion = workflow_run.get("conclusion")
        
        status_map = {
            "queued": "pending",
            "in_progress": "running",
            "completed": "success" if conclusion == "success" else "failed",
        }
        
        pipeline_status = status_map.get(gh_status)
        if conclusion and gh_status == "completed":
            pipeline_status = status_map["completed"]
            
        if pipeline_id and pipeline_status:
            await handle_build_webhook(pipeline_id, pipeline_status, body, db)

    return {"status": "ok"}


# ─── Stripe Webhook ──────────────────────────────────────

@router.post("/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe webhooks not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    # ── One-time payment: checkout.session.completed ──
    if event_type == "checkout.session.completed":
        mode = data_object.get("mode")

        if mode == "subscription":
            # Subscription checkout completed
            await _stripe_checkout_subscription_completed(db, data_object)
        else:
            # One-time order checkout
            order_id = data_object.get("metadata", {}).get("order_id")
            if order_id:
                result = await db.execute(select(Order).where(Order.id == order_id))
                order = result.scalar_one_or_none()

                if order and order.status == "pending":
                    payment = Payment(
                        order_id=order.id,
                        gateway="stripe",
                        gateway_payment_id=data_object.get("payment_intent"),
                        amount=order.amount,
                        currency=order.currency,
                        status="captured",
                        raw_response=data_object,
                    )
                    db.add(payment)
                    order.status = "paid"
                    order.gateway_payment_id = data_object.get("payment_intent")

                    from app.services.build_service import trigger_build
                    await trigger_build(order.id, db)

                    # Send order confirmation email
                    app_name = order.app_config.name if order.app_config else "App"
                    plan_name = order.plan.name if order.plan else "Plan"
                    user_email = order.user.email if order.user else None
                    if user_email:
                        send_order_confirmation_email(
                            to=user_email,
                            order_number=order.order_number,
                            app_name=app_name,
                            plan_name=plan_name,
                            amount=order.amount,
                            currency=order.currency,
                            order_id=str(order.id),
                        )

    # ── Subscription: invoice.paid ──
    elif event_type == "invoice.paid":
        await _stripe_invoice_paid(db, data_object)

    # ── Subscription: invoice.payment_failed ──
    elif event_type == "invoice.payment_failed":
        await _stripe_invoice_failed(db, data_object)

    # ── Subscription: customer.subscription.updated ──
    elif event_type == "customer.subscription.updated":
        await _stripe_subscription_updated(db, data_object)

    # ── Subscription: customer.subscription.deleted ──
    elif event_type == "customer.subscription.deleted":
        await _stripe_subscription_deleted(db, data_object)

    return {"status": "ok"}


async def _stripe_checkout_subscription_completed(db: AsyncSession, session: dict):
    """When Stripe subscription checkout completes, update with real subscription ID."""
    subscription_db_id = session.get("metadata", {}).get("subscription_id")
    if not subscription_db_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_db_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    # Replace session ID with actual Stripe subscription ID
    stripe_sub_id = session.get("subscription")
    if stripe_sub_id:
        sub.gateway_subscription_id = stripe_sub_id

    now = datetime.now(timezone.utc)
    sub.status = "active"
    sub.current_period_start = now
    sub.current_period_end = now + timedelta(days=30)


async def _stripe_invoice_paid(db: AsyncSession, invoice: dict):
    """Record successful invoice payment and update period dates."""
    stripe_sub_id = invoice.get("subscription")
    if not stripe_sub_id:
        return

    sub = await _find_subscription_by_gateway_id(db, stripe_sub_id)
    if not sub:
        return

    # Update period from invoice line items
    lines = invoice.get("lines", {}).get("data", [])
    if lines:
        period = lines[0].get("period", {})
        if period.get("start"):
            sub.current_period_start = datetime.fromtimestamp(period["start"], tz=timezone.utc)
        if period.get("end"):
            sub.current_period_end = datetime.fromtimestamp(period["end"], tz=timezone.utc)

    await handle_subscription_payment(
        subscription=sub,
        gateway_payment_id=invoice.get("payment_intent"),
        amount=invoice.get("amount_paid", 0),
        currency=invoice.get("currency", "usd").upper(),
        db=db,
    )


async def _stripe_invoice_failed(db: AsyncSession, invoice: dict):
    """Record failed invoice payment."""
    stripe_sub_id = invoice.get("subscription")
    if not stripe_sub_id:
        return

    sub = await _find_subscription_by_gateway_id(db, stripe_sub_id)
    if not sub:
        return

    payment = SubscriptionPayment(
        subscription_id=sub.id,
        gateway_payment_id=invoice.get("payment_intent"),
        amount=invoice.get("amount_due", 0),
        currency=invoice.get("currency", "usd").upper(),
        status="failed",
    )
    db.add(payment)

    # Count recent failures
    result = await db.execute(
        select(SubscriptionPayment)
        .where(
            SubscriptionPayment.subscription_id == sub.id,
            SubscriptionPayment.status == "failed",
        )
    )
    failures = list(result.scalars().all())
    if len(failures) >= 3:
        sub.status = "halted"


async def _stripe_subscription_updated(db: AsyncSession, stripe_sub: dict):
    """Sync subscription status and period from Stripe."""
    sub = await _find_subscription_by_gateway_id(db, stripe_sub.get("id", ""))
    if not sub:
        return

    status_map = {
        "active": "active",
        "past_due": "halted",
        "canceled": "cancelled",
        "unpaid": "halted",
        "trialing": "active",
        "incomplete": "pending",
        "incomplete_expired": "expired",
    }
    stripe_status = stripe_sub.get("status", "")
    if stripe_status in status_map:
        sub.status = status_map[stripe_status]

    if stripe_sub.get("current_period_start"):
        sub.current_period_start = datetime.fromtimestamp(
            stripe_sub["current_period_start"], tz=timezone.utc
        )
    if stripe_sub.get("current_period_end"):
        sub.current_period_end = datetime.fromtimestamp(
            stripe_sub["current_period_end"], tz=timezone.utc
        )
    if stripe_sub.get("canceled_at"):
        sub.cancelled_at = datetime.fromtimestamp(
            stripe_sub["canceled_at"], tz=timezone.utc
        )


async def _stripe_subscription_deleted(db: AsyncSession, stripe_sub: dict):
    """Handle Stripe subscription deletion."""
    sub = await _find_subscription_by_gateway_id(db, stripe_sub.get("id", ""))
    if not sub:
        return
    sub.status = "cancelled"
    sub.cancelled_at = datetime.now(timezone.utc)


# ─── Razorpay Webhook ────────────────────────────────────

@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Razorpay webhooks not configured")

    expected = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature or ""):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    body = json.loads(payload)
    event = body.get("event")

    # ── One-time payment events ──
    if event == "payment.captured":
        payment_entity = body.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payment_entity.get("notes", {})
        order_id = notes.get("order_id")

        if order_id:
            result = await db.execute(select(Order).where(Order.id == order_id))
            order = result.scalar_one_or_none()
            if order and order.status == "pending":
                order.status = "paid"

                # Send order confirmation email
                app_name = order.app_config.name if order.app_config else "App"
                plan_name = order.plan.name if order.plan else "Plan"
                user_email = order.user.email if order.user else None
                if user_email:
                    send_order_confirmation_email(
                        to=user_email,
                        order_number=order.order_number,
                        app_name=app_name,
                        plan_name=plan_name,
                        amount=order.amount,
                        currency=order.currency,
                        order_id=str(order.id),
                    )

    # ── Subscription events ──
    elif event == "subscription.activated":
        entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
        sub = await _find_subscription_by_gateway_id(db, entity.get("id", ""))
        if sub:
            now = datetime.now(timezone.utc)
            sub.status = "active"
            sub.current_period_start = now
            sub.current_period_end = now + timedelta(days=30)

    elif event == "subscription.charged":
        entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
        payment_entity = body.get("payload", {}).get("payment", {}).get("entity", {})
        sub = await _find_subscription_by_gateway_id(db, entity.get("id", ""))
        if sub:
            amount = payment_entity.get("amount", 0) if payment_entity else 0
            currency = payment_entity.get("currency", "INR").upper() if payment_entity else "INR"
            payment_id = payment_entity.get("id") if payment_entity else None
            await handle_subscription_payment(
                subscription=sub,
                gateway_payment_id=payment_id,
                amount=amount,
                currency=currency,
                db=db,
            )

    elif event == "subscription.completed":
        entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
        sub = await _find_subscription_by_gateway_id(db, entity.get("id", ""))
        if sub:
            sub.status = "expired"

    elif event == "subscription.halted":
        entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
        sub = await _find_subscription_by_gateway_id(db, entity.get("id", ""))
        if sub:
            sub.status = "halted"

    elif event == "subscription.cancelled":
        entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
        sub = await _find_subscription_by_gateway_id(db, entity.get("id", ""))
        if sub:
            sub.status = "cancelled"
            sub.cancelled_at = datetime.now(timezone.utc)

    elif event == "subscription.pending":
        entity = body.get("payload", {}).get("subscription", {}).get("entity", {})
        sub = await _find_subscription_by_gateway_id(db, entity.get("id", ""))
        if sub:
            sub.status = "pending"

    return {"status": "ok"}
