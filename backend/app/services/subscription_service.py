import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.models.user import User
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.subscription")


async def create_razorpay_subscription(user_id: uuid.UUID, plan_id: uuid.UUID, db: AsyncSession) -> dict:
    """Create a Razorpay subscription for monthly plans."""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan or plan.billing_type != "monthly":
        raise ValueError("Invalid plan for subscription")

    if not settings.razorpay_key_id:
        raise ValueError("Razorpay not configured")

    import razorpay
    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

    # Create a Razorpay plan if not exists (in practice, store plan IDs in DB)
    rz_plan = client.plan.create({
        "period": "monthly",
        "interval": 1,
        "item": {
            "name": f"WebToApp {plan.name} Plan",
            "amount": plan.price_inr,
            "currency": "INR",
        },
    })

    rz_subscription = client.subscription.create({
        "plan_id": rz_plan["id"],
        "total_count": 12,  # Max 12 months initially
        "quantity": 1,
    })

    subscription = Subscription(
        user_id=user_id,
        plan_id=plan_id,
        gateway="razorpay",
        gateway_subscription_id=rz_subscription["id"],
        status="active",
        current_period_start=datetime.now(timezone.utc),
    )
    db.add(subscription)
    await db.flush()

    return {
        "subscription_id": str(subscription.id),
        "gateway_subscription_id": rz_subscription["id"],
        "razorpay_key_id": settings.razorpay_key_id,
    }


async def create_stripe_subscription(user_id: uuid.UUID, plan_id: uuid.UUID, db: AsyncSession) -> dict:
    """Create a Stripe subscription for monthly plans."""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan or plan.billing_type != "monthly":
        raise ValueError("Invalid plan for subscription")

    if not settings.stripe_secret_key:
        raise ValueError("Stripe not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    # Create checkout session for subscription
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"WebToApp {plan.name} Plan"},
                "unit_amount": plan.price_usd,
                "recurring": {"interval": "month"},
            },
            "quantity": 1,
        }],
        mode="subscription",
        success_url=f"{settings.app_url}/dashboard?subscription=success",
        cancel_url=f"{settings.app_url}/pricing?subscription=cancel",
        customer_email=user.email if user else None,
        metadata={"user_id": str(user_id), "plan_id": str(plan_id)},
    )

    return {
        "checkout_url": session.url,
        "session_id": session.id,
    }


async def cancel_subscription(subscription_id: uuid.UUID, db: AsyncSession) -> Subscription:
    """Cancel an active subscription."""
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    subscription = result.scalar_one_or_none()
    if not subscription:
        raise ValueError("Subscription not found")

    if subscription.gateway == "razorpay" and settings.razorpay_key_id:
        import razorpay
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        client.subscription.cancel(subscription.gateway_subscription_id)
    elif subscription.gateway == "stripe" and settings.stripe_secret_key:
        import stripe
        stripe.api_key = settings.stripe_secret_key
        stripe.Subscription.delete(subscription.gateway_subscription_id)

    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.now(timezone.utc)
    return subscription


async def get_user_active_subscription(user_id: uuid.UUID, db: AsyncSession) -> Subscription | None:
    """Get the user's active subscription."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc())
    )
    return result.scalar_one_or_none()
