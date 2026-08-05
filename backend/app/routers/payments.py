import socket
import uuid
import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from app.models.app_config import AppConfig
from app.models.setting import Setting
from app.schemas.payment import (
    RazorpayVerifyRequest, RazorpayOrderResponse, StripeCheckoutRequest,
    StripeCheckoutResponse, TestPaymentRequest, PaymentResponse,
    PayPalCreateRequest, PayPalCreateResponse, PayPalCaptureRequest,
)
from app.schemas.auth import MessageResponse
from app.dependencies import get_current_user
from app.config import get_settings
from app.services.build_service import trigger_build
from app.rate_limit import limiter
from app.utils.email import send_order_confirmation_email, send_admin_payment_notification

import logging
logger = logging.getLogger(__name__)

settings = get_settings()
RAZORPAY_PRODUCT_KEY = "webtoapp"
router = APIRouter(prefix="/api/payments", tags=["payments"])

# Production server hostnames — when running on these, treat as live regardless of env vars
_PROD_HOSTNAMES = ("websitetoapp", "webtoapp-prod", "157.90.228.171")
# Local/dev hostnames (Mac laptops, localhost) — when running here, treat as dev
_DEV_HOSTNAME_MARKERS = ("macbook", ".local", "localhost")


def _is_dev_environment() -> bool:
    """Detect if running in development/staging.

    Order of precedence:
      1. settings.environment if explicitly set to a known value
      2. host hostname / FQDN (matches against PROD/DEV markers)
      3. default = False (production) — safer; misconfig collects real money
         instead of silently losing it.
    """
    env = (settings.environment or "").strip().lower()
    if env in ("production", "prod", "live"):
        return False
    if env in ("development", "dev", "staging", "test"):
        return True

    h = socket.gethostname().lower()
    fqdn = socket.getfqdn().lower()
    for marker in _PROD_HOSTNAMES:
        if marker in h or marker in fqdn:
            return False
    for marker in _DEV_HOSTNAME_MARKERS:
        if marker in h or marker in fqdn:
            return True
    return False


async def _is_test_mode(db: AsyncSession, user: User | None = None) -> bool:
    """Check if payment test mode is enabled globally or for this user."""
    # Check per-user test mode
    if user:
        result = await db.execute(
            select(Setting).where(Setting.key == f"user_test_mode:{user.id}")
        )
        user_setting = result.scalar_one_or_none()
        if user_setting is not None and user_setting.value.lower() in ("true", "1", "yes"):
            return True

        # Auto-enable test mode for E2E test users
        if user.email and ("e2etest+" in user.email or "e2e-full+" in user.email):
            return True

    # Hostname/env-based dev detection (replaces the prior env-var-only check
    # which silently flipped prod to test mode when ENVIRONMENT=development was set on the live host)
    if _is_dev_environment():
        return True
    result = await db.execute(
        select(Setting).where(Setting.key == "payment_test_mode")
    )
    setting = result.scalar_one_or_none()
    return setting is not None and setting.value.lower() in ("true", "1", "yes")


def _get_razorpay_credentials(test_mode: bool) -> tuple[str, str]:
    """Return (key_id, key_secret) for Razorpay based on mode."""
    if test_mode and settings.razorpay_test_key_id and settings.razorpay_test_key_secret:
        return settings.razorpay_test_key_id, settings.razorpay_test_key_secret
    return settings.razorpay_key_id, settings.razorpay_key_secret


def _get_stripe_credentials(test_mode: bool) -> tuple[str, str]:
    """Return (publishable_key, secret_key) for Stripe based on mode."""
    if test_mode and settings.stripe_test_secret_key:
        return settings.stripe_test_publishable_key, settings.stripe_test_secret_key
    return settings.stripe_publishable_key, settings.stripe_secret_key


# ── PayPal (Orders API v2, redirect/approve flow — no JS SDK needed) ──
PAYPAL_LIVE_BASE = "https://api-m.paypal.com"
PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com"
# Currencies PayPal treats as zero-decimal (no minor units in `value`).
_PAYPAL_ZERO_DECIMAL = {"JPY", "TWD", "HUF"}


def _get_paypal_credentials(test_mode: bool) -> tuple[str, str, str]:
    """Return (client_id, client_secret, api_base) for PayPal based on mode."""
    if test_mode and settings.paypal_test_client_id and settings.paypal_test_client_secret:
        return settings.paypal_test_client_id, settings.paypal_test_client_secret, PAYPAL_SANDBOX_BASE
    return settings.paypal_api_key, settings.paypal_secret, PAYPAL_LIVE_BASE


def _paypal_value(amount_minor: int, currency: str) -> str:
    """Convert our minor-unit amount to PayPal's decimal string."""
    if currency.upper() in _PAYPAL_ZERO_DECIMAL:
        return str(amount_minor)
    return f"{amount_minor / 100:.2f}"


async def _paypal_token(client, api_base: str, client_id: str, client_secret: str) -> str:
    resp = await client.post(
        f"{api_base}/v1/oauth2/token",
        auth=(client_id, client_secret),
        data={"grant_type": "client_credentials"},
    )
    if resp.status_code != 200:
        logger.error(f"PayPal oauth failed: {resp.status_code} {resp.text[:300]}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="PayPal authentication failed")
    return resp.json()["access_token"]


@router.get("/mode")
async def get_payment_mode(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    test_mode = await _is_test_mode(db, user)

    # Check which gateways are configured (for the active mode)
    rp_key, rp_secret = _get_razorpay_credentials(test_mode)
    _, stripe_secret = _get_stripe_credentials(test_mode)

    pp_id, pp_secret, _ = _get_paypal_credentials(test_mode)

    razorpay_configured = bool(rp_key and rp_secret)
    stripe_configured = bool(stripe_secret)
    paypal_configured = bool(pp_id and pp_secret)

    return {
        "test_mode": test_mode,
        "environment": settings.environment,
        "gateways": {
            "razorpay": razorpay_configured,
            "stripe": stripe_configured,
            "paypal": paypal_configured,
        },
    }


@router.post("/razorpay/create", response_model=RazorpayOrderResponse)
@limiter.limit("10/minute")
async def create_razorpay_order(
    request: Request,
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id, Order.status == "pending")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or already paid")

    test_mode = await _is_test_mode(db, user)
    rp_key_id, rp_key_secret = _get_razorpay_credentials(test_mode)

    if not rp_key_id or not rp_key_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Razorpay not configured")

    import razorpay
    client = razorpay.Client(auth=(rp_key_id, rp_key_secret))
    razorpay_order = client.order.create({
        "amount": order.amount,
        "currency": order.currency,
        "receipt": order.order_number,
        "notes": {
            "product": RAZORPAY_PRODUCT_KEY,
            "order_id": str(order.id),
        },
    })

    order.gateway_order_id = razorpay_order["id"]

    return RazorpayOrderResponse(
        razorpay_order_id=razorpay_order["id"],
        razorpay_key_id=rp_key_id,
        amount=order.amount,
        currency=order.currency,
        order_id=order.id,
    )


@router.post("/razorpay/verify", response_model=MessageResponse)
@limiter.limit("10/minute")
async def verify_razorpay_payment(
    request: Request,
    data: RazorpayVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    test_mode = await _is_test_mode(db, user)
    _, rp_key_secret = _get_razorpay_credentials(test_mode)

    # Verify signature
    message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_signature = hmac.new(
        rp_key_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, data.razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    # Record gateway_order_id if not already set (Vercel proxy flow)
    if not order.gateway_order_id:
        order.gateway_order_id = data.razorpay_order_id

    # Record payment
    gateway_label = "razorpay_test" if test_mode else "razorpay"
    payment = Payment(
        order_id=order.id,
        gateway=gateway_label,
        gateway_payment_id=data.razorpay_payment_id,
        gateway_signature=data.razorpay_signature,
        amount=order.amount,
        currency=order.currency,
        status="captured",
    )
    db.add(payment)

    order.status = "paid"
    order.gateway_payment_id = data.razorpay_payment_id
    order.payment_gateway = gateway_label

    ac_res = await db.execute(select(AppConfig).where(AppConfig.id == order.app_config_id))
    ac = ac_res.scalar_one_or_none()
    if ac and ac.status == "draft":
        ac.status = "active"

    # Persist the paid status BEFORE attempting the build — a build-trigger
    # failure must never roll back or 500 a captured payment (incident
    # 2026-07-16: keystore guard raised, verify 500'd, order stayed pending).
    await db.commit()

    # Referral reward (best-effort, never raises into the payment path)
    from app.services.referrals import grant_reward_for_paid_order
    await grant_reward_for_paid_order(db, order)

    build_error = None
    try:
        await trigger_build(order.id, db)
        await db.commit()
    except Exception as e:
        build_error = str(e)
        logger.error(f"Payment recorded but build trigger failed for order {order.id}: {e}")

    # Send emails
    app_name = order.app_config.name if order.app_config else "App"
    plan_name = order.plan.name if order.plan else "Plan"
    send_order_confirmation_email(
        to=user.email,
        order_number=order.order_number,
        app_name=app_name,
        plan_name=plan_name,
        amount=order.amount,
        currency=order.currency,
        order_id=str(order.id),
    )
    send_admin_payment_notification(
        order_number=order.order_number,
        customer_email=user.email,
        app_name=app_name,
        plan_name=plan_name,
        amount=order.amount,
        currency=order.currency,
        order_id=str(order.id),
    )

    return {"message": "Payment verified successfully. Build has been triggered."}


@router.post("/stripe/checkout", response_model=StripeCheckoutResponse)
@limiter.limit("10/minute")
async def create_stripe_checkout(
    request: Request,
    data: StripeCheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == user.id, Order.status == "pending")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or already paid")

    test_mode = await _is_test_mode(db, user)
    _, stripe_secret = _get_stripe_credentials(test_mode)

    if not stripe_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe not configured")

    import stripe
    stripe.api_key = stripe_secret

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": order.currency.lower(),
                "product_data": {"name": f"WebToApp Order {order.order_number}"},
                "unit_amount": order.amount,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{settings.app_url}/payment/success?order_id={order.id}&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.app_url}/payment/cancel?order_id={order.id}",
        metadata={"order_id": str(order.id)},
    )

    order.gateway_order_id = session.id
    gateway_label = "stripe_test" if test_mode else "stripe"
    order.payment_gateway = gateway_label
    return StripeCheckoutResponse(checkout_url=session.url, session_id=session.id)


@router.post("/paypal/create", response_model=PayPalCreateResponse)
@limiter.limit("10/minute")
async def create_paypal_order(
    request: Request,
    data: PayPalCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == user.id, Order.status == "pending")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or already paid")

    test_mode = await _is_test_mode(db, user)
    pp_id, pp_secret, api_base = _get_paypal_credentials(test_mode)
    if not pp_id or not pp_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="PayPal not configured")

    import httpx
    async with httpx.AsyncClient(timeout=30) as client:
        token = await _paypal_token(client, api_base, pp_id, pp_secret)
        resp = await client.post(
            f"{api_base}/v2/checkout/orders",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": str(order.id),
                    "custom_id": str(order.id),
                    "invoice_id": order.order_number,
                    "description": f"WebToApp Order {order.order_number}",
                    "amount": {
                        "currency_code": order.currency.upper(),
                        "value": _paypal_value(order.amount, order.currency),
                    },
                }],
                "payment_source": {
                    "paypal": {
                        "experience_context": {
                            "brand_name": "WebToApp",
                            "user_action": "PAY_NOW",
                            "shipping_preference": "NO_SHIPPING",
                            "return_url": f"{settings.app_url}/payment/success?order_id={order.id}&gateway=paypal",
                            "cancel_url": f"{settings.app_url}/payment/cancel?order_id={order.id}",
                        }
                    }
                },
            },
        )
    if resp.status_code not in (200, 201):
        logger.error(f"PayPal create order failed for {order.id}: {resp.status_code} {resp.text[:500]}")
        detail = "PayPal could not create the payment"
        try:
            issue = resp.json().get("details", [{}])[0]
            if issue.get("issue") == "CURRENCY_NOT_SUPPORTED":
                detail = f"PayPal does not support {order.currency.upper()} payments — please choose another payment method"
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)

    pp_order = resp.json()
    approval_url = next(
        (l["href"] for l in pp_order.get("links", []) if l.get("rel") in ("approve", "payer-action")),
        None,
    )
    if not approval_url:
        logger.error(f"PayPal order {pp_order.get('id')} has no approval link: {pp_order}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="PayPal did not return an approval link")

    order.gateway_order_id = pp_order["id"]
    order.payment_gateway = "paypal_test" if test_mode else "paypal"

    return PayPalCreateResponse(
        approval_url=approval_url,
        paypal_order_id=pp_order["id"],
        order_id=order.id,
    )


@router.post("/paypal/capture", response_model=MessageResponse)
@limiter.limit("10/minute")
async def capture_paypal_payment(
    request: Request,
    data: PayPalCaptureRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Idempotency: the return page can be reloaded — a paid order is a success.
    if order.status == "paid":
        return {"message": "Payment already verified. Build has been triggered."}

    if order.gateway_order_id and order.gateway_order_id != data.paypal_order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PayPal order mismatch")

    test_mode = await _is_test_mode(db, user)
    pp_id, pp_secret, api_base = _get_paypal_credentials(test_mode)
    if not pp_id or not pp_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="PayPal not configured")

    import httpx
    async with httpx.AsyncClient(timeout=30) as client:
        token = await _paypal_token(client, api_base, pp_id, pp_secret)
        resp = await client.post(
            f"{api_base}/v2/checkout/orders/{data.paypal_order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        # ORDER_ALREADY_CAPTURED (double-submit / reload) → read the order instead.
        if resp.status_code == 422 and "ALREADY_CAPTURED" in resp.text:
            resp = await client.get(
                f"{api_base}/v2/checkout/orders/{data.paypal_order_id}",
                headers={"Authorization": f"Bearer {token}"},
            )

    if resp.status_code not in (200, 201):
        logger.error(f"PayPal capture failed for {order.id}: {resp.status_code} {resp.text[:500]}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PayPal payment was not completed")

    pp_data = resp.json()
    if pp_data.get("status") != "COMPLETED":
        logger.error(f"PayPal order {data.paypal_order_id} status={pp_data.get('status')} for order {order.id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PayPal payment was not completed")

    # Verify the captured amount matches what we charged for this order.
    try:
        pu = pp_data["purchase_units"][0]
        capture = pu["payments"]["captures"][0]
        cap_amount = capture["amount"]
        expected_value = _paypal_value(order.amount, order.currency)
        if (cap_amount["currency_code"].upper() != order.currency.upper()
                or cap_amount["value"] != expected_value):
            logger.error(
                f"PayPal amount mismatch for order {order.id}: got {cap_amount}, expected {expected_value} {order.currency}"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PayPal payment amount mismatch")
        capture_id = capture["id"]
    except (KeyError, IndexError):
        logger.error(f"PayPal capture payload missing capture details for order {order.id}: {pp_data}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PayPal payment could not be verified")

    gateway_label = "paypal_test" if test_mode else "paypal"
    payment = Payment(
        order_id=order.id,
        gateway=gateway_label,
        gateway_payment_id=capture_id,
        amount=order.amount,
        currency=order.currency,
        status="captured",
        raw_response=pp_data,
    )
    db.add(payment)

    order.status = "paid"
    order.gateway_payment_id = capture_id
    order.payment_gateway = gateway_label
    if not order.gateway_order_id:
        order.gateway_order_id = data.paypal_order_id

    ac_res = await db.execute(select(AppConfig).where(AppConfig.id == order.app_config_id))
    ac = ac_res.scalar_one_or_none()
    if ac and ac.status == "draft":
        ac.status = "active"

    # Persist the paid status BEFORE attempting the build — a build-trigger
    # failure must never roll back or 500 a captured payment (same contract
    # as the Razorpay verify path).
    await db.commit()

    from app.services.referrals import grant_reward_for_paid_order
    await grant_reward_for_paid_order(db, order)

    try:
        await trigger_build(order.id, db)
        await db.commit()
    except Exception as e:
        logger.error(f"Payment recorded but build trigger failed for order {order.id}: {e}")

    app_name = order.app_config.name if order.app_config else "App"
    plan_name = order.plan.name if order.plan else "Plan"
    send_order_confirmation_email(
        to=user.email,
        order_number=order.order_number,
        app_name=app_name,
        plan_name=plan_name,
        amount=order.amount,
        currency=order.currency,
        order_id=str(order.id),
    )
    send_admin_payment_notification(
        order_number=order.order_number,
        customer_email=user.email,
        app_name=app_name,
        plan_name=plan_name,
        amount=order.amount,
        currency=order.currency,
        order_id=str(order.id),
    )

    return {"message": "Payment verified successfully. Build has been triggered."}


@router.post("/test", response_model=MessageResponse)
async def test_payment(
    data: TestPaymentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    test_mode = await _is_test_mode(db, user)
    if not test_mode:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Test payments are not enabled")

    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == user.id, Order.status == "pending")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or already paid")

    payment = Payment(
        order_id=order.id,
        gateway="test",
        gateway_payment_id=f"test_{order.order_number}",
        amount=order.amount,
        currency=order.currency,
        status="captured",
    )
    db.add(payment)

    order.status = "paid"
    order.payment_gateway = "test"

    ac_res = await db.execute(select(AppConfig).where(AppConfig.id == order.app_config_id))
    ac = ac_res.scalar_one_or_none()
    if ac and ac.status == "draft":
        ac.status = "active"

    await db.commit()

    from app.services.referrals import grant_reward_for_paid_order
    await grant_reward_for_paid_order(db, order)

    try:
        await trigger_build(order.id, db)
        await db.commit()
    except Exception as e:
        logger.error(f"Payment recorded but build trigger failed for order {order.id}: {e}")

    # Send emails
    app_name = order.app_config.name if order.app_config else "App"
    plan_name = order.plan.name if order.plan else "Plan"
    send_order_confirmation_email(
        to=user.email,
        order_number=order.order_number,
        app_name=app_name,
        plan_name=plan_name,
        amount=order.amount,
        currency=order.currency,
        order_id=str(order.id),
    )
    send_admin_payment_notification(
        order_number=order.order_number,
        customer_email=user.email,
        app_name=app_name,
        plan_name=plan_name,
        amount=order.amount,
        currency=order.currency,
        order_id=str(order.id),
    )

    return {"message": "Test payment successful. Build has been triggered."}
