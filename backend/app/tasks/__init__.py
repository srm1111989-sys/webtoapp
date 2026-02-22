import asyncio
import logging
from datetime import datetime, timezone, timedelta
from celery import Celery
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.tasks")

celery_app = Celery(
    "webtoapp",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "expire-subscriptions": {
            "task": "app.tasks.expire_subscriptions",
            "schedule": 3600.0,  # Every hour
        },
    },
)


@celery_app.task(name="app.tasks.expire_subscriptions")
def expire_subscriptions():
    """Safety net: expire subscriptions past their period end + 3 day grace."""
    asyncio.run(_expire_subscriptions())


async def _expire_subscriptions():
    from sqlalchemy import select, update
    from app.database import async_session
    from app.models.subscription import Subscription

    grace_cutoff = datetime.now(timezone.utc) - timedelta(days=3)

    async with async_session() as db:
        try:
            stmt = (
                update(Subscription)
                .where(
                    Subscription.status == "active",
                    Subscription.current_period_end.isnot(None),
                    Subscription.current_period_end < grace_cutoff,
                )
                .values(status="expired")
            )
            result = await db.execute(stmt)
            await db.commit()
            if result.rowcount:
                logger.info(f"Expired {result.rowcount} overdue subscriptions")
        except Exception:
            await db.rollback()
            raise
