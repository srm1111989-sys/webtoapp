import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    result = await db.execute(
        select(Build).where(Build.order_id == order_id).order_by(Build.created_at.desc())
    )
    return result.scalars().all()


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
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return build


@router.post("/trigger/{order_id}", response_model=BuildResponse)
async def trigger_build_endpoint(
    order_id: uuid.UUID,
    platform: str = Query(default="android", regex="^(android|ios)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id, Order.status == "paid")
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paid order not found")

    build = await trigger_build(order_id, db, platform=platform)
    return build
