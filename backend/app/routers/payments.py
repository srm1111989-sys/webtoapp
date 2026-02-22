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

settings = get_settings()
router = APIRouter(prefix="/api/payments", tags=["payments"])


async def _is_test_mode(db: AsyncSession) -> bool:
    """Check if payment test mode is enabled via DB setting or environment."""
    if settings.environment in ("development", "staging"):
        return True
    result = await db.execute(
        select(Setting).where(Setting.key == "payment_test_mode")
    )
    setting = result.scalar_one_or_none()
    return setting is not None and setting.value.lower() in ("true", "1", "yes")


@router.get("/mode")
async def get_payment_mode(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    test_mode = await _is_test_mode(db)

    # Check which gateways are configured
    razorpay_configured = bool(settings.razorpay_key_id and settings.razorpay_key_secret)
    stripe_configured = bool(settings.stripe_secret_key)

    return {
        "test_mode": test_mode,
        "environment": settings.environment,
        "gateways": {
            "razorpay": razorpay_configured,
            "stripe": stripe_configured,
        },
    }


@router.post("/razorpay/create", response_model=RazorpayOrderResponse)
async def create_razorpay_order(
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

    if not settings.razorpay_key_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Razorpay not configured")

    import razorpay
    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    razorpay_order = client.order.create({
        "amount": order.amount,
        "currency": order.currency,
        "receipt": order.order_number,
    })

    order.gateway_order_id = razorpay_order["id"]

    return RazorpayOrderResponse(
        razorpay_order_id=razorpay_order["id"],
        razorpay_key_id=settings.razorpay_key_id,
        amount=order.amount,
        currency=order.currency,
        order_id=order.id,
    )


@router.post("/razorpay/verify", response_model=MessageResponse)
async def verify_razorpay_payment(
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

    # Verify signature
    message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, data.razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    # Record payment
    payment = Payment(
        order_id=order.id,
        gateway="razorpay",
        gateway_payment_id=data.razorpay_payment_id,
        gateway_signature=data.razorpay_signature,
        amount=order.amount,
        currency=order.currency,
        status="captured",
    )
    db.add(payment)

    order.status = "paid"
    order.gateway_payment_id = data.razorpay_payment_id

    await db.flush()

    # Trigger build
    await trigger_build(order.id, db)

    return {"message": "Payment verified successfully. Build has been triggered."}


@router.post("/stripe/checkout", response_model=StripeCheckoutResponse)
async def create_stripe_checkout(
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

    if not settings.stripe_secret_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key

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
    return StripeCheckoutResponse(checkout_url=session.url, session_id=session.id)


@router.post("/test", response_model=MessageResponse)
async def test_payment(
    data: TestPaymentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    test_mode = await _is_test_mode(db)
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
