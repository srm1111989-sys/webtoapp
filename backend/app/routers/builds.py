import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.build import Build
from app.schemas.build import BuildResponse, BuildTriggerRequest
from app.dependencies import get_current_user, team_access
from app.services.build_service import trigger_build

router = APIRouter(prefix="/api/builds", tags=["builds"])


@router.get("/order/{order_id}", response_model=list[BuildResponse])
async def get_builds_for_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify order belongs to user or a workspace shared with them
    access = await team_access(user, db)
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id.in_(list(access.keys())))
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

    # Verify user owns the order or has team access to its workspace
    access = await team_access(user, db)
    result = await db.execute(
        select(Order).where(Order.id == build.order_id, Order.user_id.in_(list(access.keys())))
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
    access = await team_access(user, db)
    result = await db.execute(
        select(Order).where(
            Order.id == order_id, Order.user_id.in_(list(access.keys())), Order.status == "paid"
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paid order not found")
    if access.get(order.user_id) == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers can't trigger builds")

    # Check for active builds
    active_build_result = await db.execute(
        select(Build).where(
            Build.order_id == order_id,
            Build.platform == platform,
            Build.status.in_(["pending", "building", "running"])
        )
    )
    if active_build_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A build for this platform is already in progress. Please wait for it to complete."
        )

    # Build limits (2026-07-17 model):
    #   free — 1 SUCCESSFUL build per user, lifetime (failures never count)
    #   paid — 3 successful REBUILDS per app per calendar month (the order's
    #          first successful build is not a rebuild; failures never count)
    is_free = order.amount == 0
    if is_free:
        # Quota belongs to the order's OWNER (matters when an editor triggers
        # a build on a shared workspace).
        free_build_count_result = await db.execute(
            select(func.count(Build.id))
            .join(Order, Build.order_id == Order.id)
            .where(Order.user_id == order.user_id, Order.amount == 0, Build.status == "success")
        )
        if (free_build_count_result.scalar() or 0) >= 1:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Your free build is already used. Upgrade this app to a paid plan to build again.",
            )
    else:
        from datetime import datetime as _dt, timezone as _tz
        month_start = _dt.now(_tz.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stats = (await db.execute(
            select(
                func.count(Build.id).filter(Build.status == "success", Build.created_at >= month_start),
                func.min(Build.created_at).filter(Build.status == "success"),
            ).where(Build.order_id == order_id)
        )).one()
        month_success, first_success = stats[0] or 0, stats[1]
        if first_success is not None and first_success >= month_start:
            month_success = max(0, month_success - 1)  # initial build isn't a rebuild
        if month_success >= 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Monthly rebuild limit reached (3 rebuilds per app per month). It resets on the 1st.",
            )

    build = await trigger_build(order_id, db, platform=platform)
    return build
