import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionDetailResponse,
)
from app.dependencies import get_current_user
from app.services import subscription_service

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("/pro-plan")
async def get_pro_plan(db: AsyncSession = Depends(get_db)):
    """The Pro Monthly plan (t80). Deliberately is_active=false so it never
    appears in the one-time wizard plan picker — the subscribe flow fetches
    it here by slug instead."""
    from sqlalchemy import select
    from app.models.plan import Plan
    result = await db.execute(select(Plan).where(Plan.slug == "pro-monthly"))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pro plan not configured")
    return {"id": str(plan.id), "name": plan.name, "description": plan.description,
            "price_inr": plan.price_inr, "price_usd": plan.price_usd}


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    data: SubscriptionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new subscription for a monthly plan."""
    # Check for existing active subscription
    existing = await subscription_service.get_user_active_subscription(user.id, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription",
        )

    try:
        if data.currency == "INR":
            result = await subscription_service.create_razorpay_subscription(
                user.id, data.plan_id, data.app_config_id, db,
            )
        else:
            result = await subscription_service.create_stripe_subscription(
                user.id, data.plan_id, data.app_config_id, db,
            )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[SubscriptionResponse])
async def list_subscriptions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all subscriptions for the current user."""
    subscriptions = await subscription_service.get_user_subscriptions(user.id, db)
    responses = []
    for sub in subscriptions:
        resp = SubscriptionResponse.model_validate(sub)
        if sub.plan:
            resp.plan_name = sub.plan.name
        responses.append(resp)
    return responses


@router.get("/active", response_model=SubscriptionResponse | None)
async def get_active_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's current active subscription."""
    sub = await subscription_service.get_user_active_subscription(user.id, db)
    if not sub:
        return None
    resp = SubscriptionResponse.model_validate(sub)
    if sub.plan:
        resp.plan_name = sub.plan.name
    return resp


@router.get("/{subscription_id}", response_model=SubscriptionDetailResponse)
async def get_subscription(
    subscription_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get subscription detail with payment history."""
    sub = await subscription_service.get_subscription_detail(subscription_id, user.id, db)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    resp = SubscriptionDetailResponse.model_validate(sub)
    if sub.plan:
        resp.plan_name = sub.plan.name
    return resp


@router.post("/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an active subscription."""
    try:
        sub = await subscription_service.cancel_subscription(subscription_id, user.id, db)
        resp = SubscriptionResponse.model_validate(sub)
        if sub.plan:
            resp.plan_name = sub.plan.name
        return resp
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
