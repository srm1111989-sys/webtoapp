import json
import hmac
import hashlib
import logging
from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.build import Build
from app.models.order import Order
from app.models.payment import Payment
from app.config import get_settings
from app.services.build_service import handle_build_webhook

settings = get_settings()
logger = logging.getLogger("webtoapp.webhooks")
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


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

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")

        if order_id:
            result = await db.execute(select(Order).where(Order.id == order_id))
            order = result.scalar_one_or_none()

            if order and order.status == "pending":
                payment = Payment(
                    order_id=order.id,
                    gateway="stripe",
                    gateway_payment_id=session.get("payment_intent"),
                    amount=order.amount,
                    currency=order.currency,
                    status="captured",
                    raw_response=session,
                )
                db.add(payment)
                order.status = "paid"
                order.gateway_payment_id = session.get("payment_intent")

                from app.services.build_service import trigger_build
                await trigger_build(order.id, db)

    return {"status": "ok"}


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

    if event == "payment.captured":
        payment_entity = body.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payment_entity.get("notes", {})
        order_id = notes.get("order_id")

        if order_id:
            result = await db.execute(select(Order).where(Order.id == order_id))
            order = result.scalar_one_or_none()
            if order and order.status == "pending":
                order.status = "paid"

    return {"status": "ok"}
