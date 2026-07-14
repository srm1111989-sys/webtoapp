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
