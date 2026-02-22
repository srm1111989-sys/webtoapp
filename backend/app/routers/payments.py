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
from app.models.setting import Setting
from app.schemas.payment import (
    RazorpayVerifyRequest, RazorpayOrderResponse, StripeCheckoutRequest,
    StripeCheckoutResponse, TestPaymentRequest, PaymentResponse,
)
from app.schemas.auth import MessageResponse
from app.dependencies import get_current_user
from app.config import get_settings
from app.services.build_service import trigger_build
from app.rate_limit import limiter

settings = get_settings()
router = APIRouter(prefix="/api/payments", tags=["payments"])


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

    # Check global test mode
    if settings.environment in ("development", "staging"):
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


@router.get("/mode")
async def get_payment_mode(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    test_mode = await _is_test_mode(db, user)

    # Check which gateways are configured (for the active mode)
    rp_key, rp_secret = _get_razorpay_credentials(test_mode)
    _, stripe_secret = _get_stripe_credentials(test_mode)

    razorpay_configured = bool(rp_key and rp_secret)
    stripe_configured = bool(stripe_secret)

    return {
        "test_mode": test_mode,
        "environment": settings.environment,
        "gateways": {
            "razorpay": razorpay_configured,
            "stripe": stripe_configured,
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

    await db.flush()

    # Trigger build
    await trigger_build(order.id, db)

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
    await db.flush()

    await trigger_build(order.id, db)

    return {"message": "Test payment successful. Build has been triggered."}
