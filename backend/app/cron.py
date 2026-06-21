import logging
import time
import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import async_session
from app.models.build import Build
from app.services.github_service import GitHubService
from app.services.gitlab_service import GitLabService

logger = logging.getLogger("webtoapp.cron")

# Quota results are cached for 5 minutes so each build doesn't re-check all 3 APIs
_QUOTA_TTL = 300
_quota_cache: dict[str, tuple[bool, float]] = {}

def _check_quota_cached(key: str, check_fn) -> bool:
    now = time.monotonic()
    if key in _quota_cache:
        result, ts = _quota_cache[key]
        if now - ts < _QUOTA_TTL:
            return result
    result = check_fn()
    _quota_cache[key] = (result, now)
    return result

def _build_provider_list(platform: str) -> list[tuple[str, object]]:
    """
    Returns providers ordered by preference, skipping any whose quota is exhausted.
    Falls back to all three (in order) if every quota check returns False, so a
    genuine API error never blocks all builds.
    """
    gitlab  = GitLabService(platform=platform)
    github1 = GitHubService(platform=platform, account=1)
    github2 = GitHubService(platform=platform, account=2)

    candidates = [
        ("gitlab",   gitlab,  lambda: _check_quota_cached("gitlab",   gitlab.has_quota)),
        ("github1",  github1, lambda: _check_quota_cached("github1",  github1.has_quota)),
        ("github2",  github2, lambda: _check_quota_cached("github2",  github2.has_quota)),
    ]

    available = [(name, svc) for name, svc, check in candidates if check()]

    if not available:
        # Every provider reported exhausted quota — try all anyway (quota check may be wrong)
        logger.warning("All providers report exhausted quota; attempting all in fallback order")
        available = [(name, svc) for name, svc, _ in candidates]

    return available


async def process_pending_build():
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Build)
                .where(Build.status == "pending")
                .order_by(Build.created_at.asc())
                .limit(1)
            )
            build = result.scalar_one_or_none()
            if not build:
                return

            build.status = "building"
            build.started_at = datetime.now(timezone.utc)
            await db.commit()

            providers = _build_provider_list(build.platform)
            errors = {}

            for provider_name, provider in providers:
                try:
                    variables = build.variables.copy() if build.variables else {}
                    variables["_build_provider"] = provider_name

                    pipeline = provider.trigger_pipeline(variables)

                    build.pipeline_id = pipeline.get("id")
                    build.variables = variables
                    await db.commit()

                    logger.info(f"Build {build.id} triggered via {provider_name} (pipeline {build.pipeline_id})")
                    return

                except Exception as e:
                    errors[provider_name] = str(e)
                    logger.warning(f"Build {build.id}: {provider_name} failed — {e}")

            build.status = "failed"
            build.error_message = "All providers failed: " + "; ".join(f"{k}={v}" for k, v in errors.items())
            await db.commit()
            logger.error(f"Build {build.id} failed on all providers: {errors}")

    except Exception as e:
        logger.error(f"Error in process_pending_build: {e}")


scheduler = AsyncIOScheduler()
scheduler.add_job(process_pending_build, 'interval', minutes=1)

def start_scheduler():
    scheduler.start()
    logger.info("Started cron scheduler for pending builds")
