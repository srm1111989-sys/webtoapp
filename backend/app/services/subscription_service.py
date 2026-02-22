import uuid
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.subscription import Subscription, SubscriptionPayment
from app.models.plan import Plan
from app.models.user import User
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.subscription")


async def create_razorpay_subscription(
    user_id: uuid.UUID, plan_id: uuid.UUID, app_config_id: uuid.UUID, db: AsyncSession
) -> dict:
    """Create a Razorpay subscription for monthly plans."""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan or plan.billing_type != "monthly":
        raise ValueError("Invalid plan for subscription")

    if not settings.razorpay_key_id:
        raise ValueError("Razorpay not configured")

    import razorpay
    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

    now = datetime.now(timezone.utc)

    # Create DB subscription first (pending status)
    subscription = Subscription(
        user_id=user_id,
        plan_id=plan_id,
        app_config_id=app_config_id,
        gateway="razorpay",
        status="pending",
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(subscription)
    await db.flush()

    # Create Razorpay plan
    rz_plan = client.plan.create({
        "period": "monthly",
        "interval": 1,
        "item": {
            "name": f"WebToApp {plan.name} Plan",
            "amount": plan.price_inr,
            "currency": "INR",
        },
    })

    # Create Razorpay subscription with effectively unlimited billing
    rz_subscription = client.subscription.create({
        "plan_id": rz_plan["id"],
        "total_count": 120,
        "quantity": 1,
        "notes": {
            "user_id": str(user_id),
            "subscription_id": str(subscription.id),
            "app_config_id": str(app_config_id),
        },
    })

    subscription.gateway_subscription_id = rz_subscription["id"]
    subscription.subscription_metadata = {
        "razorpay_plan_id": rz_plan["id"],
        "app_config_id": str(app_config_id),
    }

    return {
        "subscription_id": str(subscription.id),
        "gateway_subscription_id": rz_subscription["id"],
        "razorpay_key_id": settings.razorpay_key_id,
    }


async def create_stripe_subscription(
    user_id: uuid.UUID, plan_id: uuid.UUID, app_config_id: uuid.UUID, db: AsyncSession
) -> dict:
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

    now = datetime.now(timezone.utc)

    # Create DB subscription first (pending status)
    subscription = Subscription(
        user_id=user_id,
        plan_id=plan_id,
        app_config_id=app_config_id,
        gateway="stripe",
        status="pending",
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(subscription)
    await db.flush()

    # Create checkout session for subscription with dynamic price
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
        success_url=f"{settings.app_url}/subscription?success=true",
        cancel_url=f"{settings.app_url}/subscription?cancelled=true",
        customer_email=user.email if user else None,
        metadata={
            "user_id": str(user_id),
            "subscription_id": str(subscription.id),
            "plan_id": str(plan_id),
            "app_config_id": str(app_config_id),
        },
    )

    subscription.gateway_subscription_id = session.id
    subscription.subscription_metadata = {
        "stripe_session_id": session.id,
        "app_config_id": str(app_config_id),
    }

    return {
        "subscription_id": str(subscription.id),
        "checkout_url": session.url,
        "session_id": session.id,
    }


async def cancel_subscription(subscription_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Subscription:
    """Cancel an active subscription."""
    result = await db.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id,
        )
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        raise ValueError("Subscription not found")

    if subscription.status not in ("active", "pending"):
        raise ValueError("Subscription cannot be cancelled")

    if subscription.gateway == "razorpay" and settings.razorpay_key_id and subscription.gateway_subscription_id:
        import razorpay
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        try:
            client.subscription.cancel(subscription.gateway_subscription_id, {"cancel_at_cycle_end": 1})
        except Exception as e:
            logger.warning(f"Failed to cancel Razorpay subscription: {e}")
    elif subscription.gateway == "stripe" and settings.stripe_secret_key and subscription.gateway_subscription_id:
        import stripe
        stripe.api_key = settings.stripe_secret_key
        try:
            stripe.Subscription.modify(subscription.gateway_subscription_id, cancel_at_period_end=True)
        except Exception:
            # May still be a session ID, not a real subscription ID
            try:
                stripe.Subscription.delete(subscription.gateway_subscription_id)
            except Exception as e:
                logger.warning(f"Failed to cancel Stripe subscription: {e}")

    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.now(timezone.utc)
    return subscription


async def get_user_active_subscription(user_id: uuid.UUID, db: AsyncSession) -> Subscription | None:
    """Get the user's active subscription."""
    result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status.in_(["active", "pending"]),
        )
        .order_by(Subscription.created_at.desc())
    )
    return result.scalar_one_or_none()


async def get_user_subscriptions(user_id: uuid.UUID, db: AsyncSession) -> list[Subscription]:
    """Get all subscriptions for a user."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    )
    return list(result.scalars().all())


async def get_subscription_detail(
    subscription_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> Subscription | None:
    """Get a subscription with payment history."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.id == subscription_id, Subscription.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def handle_subscription_payment(
    subscription: Subscription,
    gateway_payment_id: str | None,
    amount: int,
    currency: str,
    db: AsyncSession,
) -> None:
    """Record a successful subscription payment and update period dates."""
    now = datetime.now(timezone.utc)

    subscription.status = "active"
    subscription.current_period_start = now
    subscription.current_period_end = now + timedelta(days=30)

    payment = SubscriptionPayment(
        subscription_id=subscription.id,
        gateway_payment_id=gateway_payment_id,
        amount=amount,
        currency=currency,
        status="success",
        paid_at=now,
    )
    db.add(payment)

    # Trigger build on first payment
    existing_payments = await db.execute(
        select(SubscriptionPayment)
        .where(
            SubscriptionPayment.subscription_id == subscription.id,
            SubscriptionPayment.status == "success",
        )
    )
    if len(list(existing_payments.scalars().all())) <= 1 and subscription.app_config_id:
        # This is the first payment, trigger a build
        try:
            from app.services.build_service import trigger_build_for_subscription
            await trigger_build_for_subscription(subscription, db)
        except ImportError:
            logger.info("Build trigger for subscription not yet implemented")
        except Exception as e:
            logger.error(f"Failed to trigger build for subscription: {e}")
