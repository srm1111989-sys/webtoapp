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
        "poll-stuck-builds": {
            "task": "app.tasks.poll_stuck_builds",
            "schedule": 600.0,  # Every 10 minutes
        },
    },
)


@celery_app.task(name="app.tasks.expire_subscriptions")
def expire_subscriptions():
    """Safety net: expire subscriptions past their period end + 3 day grace."""
    asyncio.run(_expire_subscriptions())


@celery_app.task(name="app.tasks.poll_stuck_builds")
def poll_stuck_builds():
    """Poll GitLab for builds stuck in 'building' > 10 min. Update status from pipeline."""
    asyncio.run(_poll_stuck_builds())


async def _poll_stuck_builds():
    from sqlalchemy import select
    from app.database import celery_async_session as async_session
    from app.models.build import Build
    from app.services.build_service import handle_build_webhook
    from app.services.gitlab_service import GitLabService

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)

    async with async_session() as db:
        try:
            result = await db.execute(
                select(Build).where(
                    Build.status.in_(["building", "pending"]),
                    Build.created_at < cutoff,
                    Build.pipeline_id.isnot(None),
                )
            )
            stuck_builds = list(result.scalars().all())

            if not stuck_builds:
                return

            logger.info(f"Found {len(stuck_builds)} stuck builds, polling GitLab...")

            for build in stuck_builds:
                try:
                    gitlab = GitLabService(platform=build.platform or "android")
                    pipeline = gitlab.get_pipeline(build.pipeline_id)

                    if not pipeline:
                        # Pipeline not found — mark failed
                        age_hours = (datetime.now(timezone.utc) - build.created_at).total_seconds() / 3600
                        if age_hours > 2:
                            build.status = "failed"
                            build.error_message = "Pipeline not found on GitLab"
                            build.completed_at = datetime.now(timezone.utc)
                            logger.warning(f"Build {build.id}: pipeline {build.pipeline_id} not found, marked failed")
                        continue

                    pipeline_status = pipeline.get("status", "")

                    if pipeline_status == "success":
                        logger.info(f"Build {build.id}: pipeline {build.pipeline_id} succeeded, processing...")
                        await handle_build_webhook(build.pipeline_id, "success", {}, db)

                    elif pipeline_status == "failed":
                        # Fetch error logs
                        log_text = ""
                        try:
                            jobs = gitlab.get_pipeline_jobs(build.pipeline_id)
                            failed_jobs = [j for j in jobs if j.get("status") == "failed"]
                            if failed_jobs:
                                job_log = gitlab.get_job_log(failed_jobs[0]["id"])
                                log_text = job_log[-500:] if job_log else ""
                        except Exception:
                            pass

                        build.status = "failed"
                        build.error_message = f"Pipeline failed: {log_text[:200]}" if log_text else "Pipeline failed on GitLab"
                        build.completed_at = datetime.now(timezone.utc)
                        logger.warning(f"Build {build.id}: pipeline {build.pipeline_id} failed")

                    elif pipeline_status == "canceled":
                        build.status = "failed"
                        build.error_message = "Pipeline was cancelled"
                        build.completed_at = datetime.now(timezone.utc)

                    elif pipeline_status in ("running", "pending", "created"):
                        # Still running — check if too old (>2 hours)
                        age_hours = (datetime.now(timezone.utc) - build.created_at).total_seconds() / 3600
                        if age_hours > 2:
                            build.status = "failed"
                            build.error_message = f"Build timed out after {age_hours:.1f} hours"
                            build.completed_at = datetime.now(timezone.utc)
                            logger.warning(f"Build {build.id}: timed out after {age_hours:.1f}h")

                except Exception as e:
                    logger.error(f"Failed to poll build {build.id}: {e}")

            await db.commit()
            logger.info(f"Processed {len(stuck_builds)} stuck builds")

        except Exception as e:
            await db.rollback()
            logger.error(f"poll_stuck_builds failed: {e}")
            raise


async def _expire_subscriptions():
    from sqlalchemy import select, update
    from app.database import celery_async_session as async_session
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
