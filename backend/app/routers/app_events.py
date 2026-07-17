"""Telemetry from generated FREE apps (open events) + admin analytics.

The ingest endpoint is public and unauthenticated by design — generated apps
have no user session. It is best-effort and cheap: validate lightly, insert,
return 204. Only free apps send these (the template gates the ping on the
free/watermark flag).
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.app_event import AppEvent
from app.models.admin import Admin
from app.dependencies import get_current_admin

router = APIRouter(prefix="/api/apps", tags=["app-events"])


class AppEventIn(BaseModel):
    order_id: int | None = None
    event: str = "app_open"
    device_id: str | None = None
    package: str | None = None
    app_version: str | None = None
    platform: str = "android"


@router.post("/event", status_code=204)
async def ingest_event(data: AppEventIn, request: Request, db: AsyncSession = Depends(get_db)):
    # Best-effort: never error the calling app.
    try:
        ip = (request.headers.get("cf-connecting-ip")
              or (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
              or (request.client.host if request.client else None))
        db.add(AppEvent(
            order_id=data.order_id,
            event=(data.event or "app_open")[:40],
            device_id=(data.device_id or None) and data.device_id[:64],
            package=(data.package or None) and data.package[:255],
            app_version=(data.app_version or None) and data.app_version[:30],
            platform=(data.platform or "android")[:16],
            ip_address=ip[:45] if ip else None,
        ))
        await db.commit()
    except Exception:
        await db.rollback()
    return Response(status_code=204)


@router.get("/analytics/summary")
async def analytics_summary(
    days: int = 30,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Per-app free-tier usage: opens, unique installs (devices), recent activity."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    day7 = datetime.now(timezone.utc) - timedelta(days=7)
    rows = (await db.execute(
        select(
            AppEvent.order_id,
            func.count(AppEvent.id).label("opens"),
            func.count(func.distinct(AppEvent.device_id)).label("installs"),
            func.max(AppEvent.created_at).label("last_seen"),
            func.count(AppEvent.id).filter(AppEvent.created_at >= day7).label("opens_7d"),
            func.count(func.distinct(AppEvent.device_id)).filter(AppEvent.created_at >= day7).label("active_7d"),
        )
        .where(AppEvent.created_at >= since)
        .group_by(AppEvent.order_id)
        .order_by(func.count(func.distinct(AppEvent.device_id)).desc())
    )).all()
    return {
        "days": days,
        "apps": [
            {
                "order_id": r.order_id,
                "opens": r.opens,
                "installs": r.installs,
                "opens_7d": r.opens_7d,
                "active_installs_7d": r.active_7d,
                "last_seen": r.last_seen.isoformat() if r.last_seen else None,
            }
            for r in rows
        ],
    }

@router.get("/entitlement")
async def get_entitlement(order_id: str, db: AsyncSession = Depends(get_db)):
    """Public entitlement check for generated apps (called at app launch).

    Lets a trial/watermarked build unlock itself WITHOUT a rebuild once the
    app has been upgraded to a paid plan. Keyed by the unguessable order UUID;
    returns a single boolean — no PII, no payment info (Variant B: the app
    itself never shows payment UI; checkout happens on the website only).
    """
    import uuid as _uuid
    from app.models.order import Order
    from app.models.app_config import AppConfig

    try:
        oid = _uuid.UUID(order_id)
    except (ValueError, AttributeError):
        return {"paid": False}

    order = (await db.execute(select(Order).where(Order.id == oid))).scalar_one_or_none()
    if not order:
        return {"paid": False}

    # Paid if any paid-money order exists for the same app config, or for the
    # same user + same website URL (re-purchase of the same site).
    paid_same_config = (await db.execute(
        select(func.count(Order.id)).where(
            Order.app_config_id == order.app_config_id, Order.amount > 0,
            Order.status.in_(("paid", "completed")))
    )).scalar() or 0
    paid_same_site = 0
    ac = (await db.execute(select(AppConfig).where(AppConfig.id == order.app_config_id))).scalar_one_or_none()
    if not paid_same_config and ac and ac.url:
        paid_same_site = (await db.execute(
            select(func.count(Order.id))
            .join(AppConfig, AppConfig.id == Order.app_config_id)
            .where(Order.user_id == order.user_id, Order.amount > 0,
                   Order.status.in_(("paid", "completed")),
                   AppConfig.url == ac.url)
        )).scalar() or 0

    return {"paid": bool(paid_same_config or paid_same_site)}

