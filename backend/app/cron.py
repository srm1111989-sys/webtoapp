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
    github1 = GitHubService(platform=platform, account=1)
    github2 = GitHubService(platform=platform, account=2)

    # iOS builds only exist on the GitHub runners (macOS); GitLab's pipeline
    # builds Android, so it must never be offered for iOS.
    if platform == "ios":
        candidates = [
            ("github1", github1, lambda: _check_quota_cached("github1", github1.has_quota)),
            ("github2", github2, lambda: _check_quota_cached("github2", github2.has_quota)),
        ]
    else:
        gitlab = GitLabService(platform=platform)
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
            build.error_message = "Build could not be started at this time. Please retry in a few minutes or contact support@websitetoapp.app."
            await db.commit()
            logger.error(f"Build {build.id} failed on all providers: {errors}")

    except Exception as e:
        logger.error(f"Error in process_pending_build: {e}")


async def sync_active_builds():
    """Poll the status of currently active ('building') builds and update them if complete."""
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Build)
                .where(Build.status == "building")
            )
            active_builds = result.scalars().all()
            if not active_builds:
                return

            from app.services.build_service import handle_build_webhook

            for build in active_builds:
                if not build.pipeline_id:
                    continue

                provider_name = build.variables.get("_build_provider") if build.variables else None
                if not provider_name:
                    provider_name = "gitlab"

                try:
                    if provider_name in ["github1", "github"]:
                        service = GitHubService(platform=build.platform, account=1)
                    elif provider_name == "github2":
                        service = GitHubService(platform=build.platform, account=2)
                    else:
                        service = GitLabService(platform=build.platform)

                    pipeline_data = service.get_pipeline(build.pipeline_id)
                    remote_status = pipeline_data.get("status")

                    # Self-heal: a GitLab pipeline that died on ci_quota_exceeded
                    # isn't a real build failure — requeue it so the provider list
                    # (with GitLab now known-exhausted) sends it to GitHub. Retry once.
                    if (remote_status == "failed" and provider_name not in ["github1", "github2", "github"]
                            and not (build.variables or {}).get("_quota_retried")
                            and isinstance(service, GitLabService)
                            and service.pipeline_quota_exceeded(build.pipeline_id)):
                        logger.warning(f"Build {build.id}: GitLab ci_quota_exceeded — requeuing on another provider")
                        _quota_cache["gitlab"] = (False, time.monotonic())  # skip GitLab in next selection
                        v = dict(build.variables or {})
                        v["_quota_retried"] = True
                        v.pop("_build_provider", None)
                        build.variables = v
                        build.status = "pending"
                        build.pipeline_id = None
                        build.started_at = None
                        await db.commit()
                        continue

                    if remote_status in ["success", "failed", "canceled"]:
                        logger.info(f"Sync active builds: Build {build.id} (pipeline {build.pipeline_id}) finished with status {remote_status} on {provider_name}")
                        await handle_build_webhook(build.pipeline_id, remote_status, pipeline_data, db)
                        await db.commit()
                except Exception as e:
                    logger.warning(f"Failed to sync build {build.id} (pipeline {build.pipeline_id}) via {provider_name}: {e}")

    except Exception as e:
        logger.error(f"Error in sync_active_builds: {e}")


scheduler = AsyncIOScheduler()
scheduler.add_job(process_pending_build, 'interval', minutes=1)
scheduler.add_job(sync_active_builds, 'interval', minutes=1)

def start_scheduler():
    scheduler.start()
    logger.info("Started cron scheduler for pending builds and active build sync")
