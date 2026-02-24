import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.build import Build
from app.schemas.build import BuildResponse, BuildTriggerRequest
from app.dependencies import get_current_user
from app.services.build_service import trigger_build

router = APIRouter(prefix="/api/builds", tags=["builds"])


@router.get("/order/{order_id}", response_model=list[BuildResponse])
async def get_builds_for_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify order belongs to user
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    result = await db.execute(
        select(Build).where(Build.order_id == order_id).order_by(Build.created_at.desc())
    )
    builds = result.scalars().all()

    # Strip keystore_url for free plan builds
    if order.amount == 0:
        for build in builds:
            build.keystore_url = None

    return builds


@router.get("/{build_id}", response_model=BuildResponse)
async def get_build(
    build_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Build).where(Build.id == build_id))
    build = result.scalar_one_or_none()
    if not build:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Build not found")

    # Verify user owns the order
    result = await db.execute(
        select(Order).where(Order.id == build.order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Strip keystore_url for free plan builds
    if order.amount == 0:
        build.keystore_url = None

    return build


@router.post("/trigger/{order_id}", response_model=BuildResponse)
async def trigger_build_endpoint(
    order_id: uuid.UUID,
    platform: str = Query("android"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id, Order.status == "paid")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paid order not found")

    # Check 30-day rolling build limit (10 builds per 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    build_count_result = await db.execute(
        select(func.count(Build.id)).where(
            Build.order_id == order_id,
            Build.created_at >= thirty_days_ago,
        )
    )
    build_count = build_count_result.scalar() or 0
    if build_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Build limit reached (10 builds per 30 days). Try again later.",
        )

    build = await trigger_build(order_id, db, platform=platform)
    return build
