import logging
import os
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
    github3 = GitHubService(platform=platform, account=3)

    # iOS builds only exist on the GitHub runners (macOS); GitLab's pipeline
    # builds Android, so it must never be offered for iOS.
    if platform == "ios":
        candidates = [
            ("github1", github1, lambda: _check_quota_cached("github1", github1.has_quota)),
            ("github2", github2, lambda: _check_quota_cached("github2", github2.has_quota)),
            ("github3", github3, lambda: _check_quota_cached("github3", github3.has_quota)),
        ]
    else:
        gitlab = GitLabService(platform=platform)
        candidates = [
            ("gitlab",   gitlab,  lambda: _check_quota_cached("gitlab",   gitlab.has_quota)),
            ("github1",  github1, lambda: _check_quota_cached("github1",  github1.has_quota)),
            ("github2",  github2, lambda: _check_quota_cached("github2",  github2.has_quota)),
            ("github3",  github3, lambda: _check_quota_cached("github3",  github3.has_quota)),
        ]

    # Ops escape hatch: CI_SKIP_PROVIDERS=github1,gitlab hard-excludes providers.
    # Needed when a provider is broken in a way quota checks can't see — e.g.
    # GitHub's artifact-storage "quota hit" flag stays stale for 6-12h after a
    # purge (2026-07-18 incident), failing every run at the Upload step while
    # dispatch still succeeds. Set in /root/.webtoapp-local.env; REMOVE after.
    skip = {s.strip() for s in os.environ.get("CI_SKIP_PROVIDERS", "").split(",") if s.strip()}
    if skip:
        kept = [c for c in candidates if c[0] not in skip]
        if kept:  # never skip our way into having zero candidates
            logger.warning(f"CI_SKIP_PROVIDERS active — excluding {sorted(skip)}")
            candidates = kept

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

            # Skip providers this build already failed on (e.g. a GitHub account
            # whose artifact storage was full — see build_service.handle_build_webhook).
            # Never filter down to zero: a stale failed-list must not wedge the build.
            failed_providers = set((build.variables or {}).get("_failed_providers", []))
            if failed_providers:
                kept = [(n, p) for (n, p) in providers if n not in failed_providers]
                if kept:
                    providers = kept
                    logger.info(f"Build {build.id}: excluding already-failed providers {sorted(failed_providers)}")

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
                    elif provider_name == "github3":
                        service = GitHubService(platform=build.platform, account=3)
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
                        # The quota cache alone is UNRELIABLE for the requeue: its TTL /
                        # a has_quota re-check can re-elect gitlab and the retry dies
                        # terminally (build 1835f6bf, 2026-08-01). _failed_providers is
                        # what process_pending_build durably excludes — use it, exactly
                        # like the github artifact-quota reroute does.
                        failed = set(v.get("_failed_providers", []))
                        failed.add("gitlab")
                        v["_failed_providers"] = sorted(failed)
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
async def cleanup_abandoned_drafts():
    """Delete wizard drafts (app_configs with status='draft' and no orders)
    older than 1h. Drafts exist only while the wizard is open — the frontend
    deletes them on exit; this sweep catches closed tabs
    (product rule 2026-07-17: we don't keep drafts)."""
    try:
        from datetime import datetime, timedelta, timezone
        from sqlalchemy import delete, select, and_, not_, exists
        from app.models.app_config import AppConfig
        from app.models.order import Order
        async with async_session() as db:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
            result = await db.execute(
                delete(AppConfig).where(
                    AppConfig.status == "draft",
                    AppConfig.created_at < cutoff,
                    not_(exists(select(Order.id).where(Order.app_config_id == AppConfig.id))),
                )
            )
            await db.commit()
            if result.rowcount:
                logger.info(f"cleanup_abandoned_drafts: removed {result.rowcount} stale drafts")
    except Exception as e:
        logger.error(f"cleanup_abandoned_drafts failed: {e}")

scheduler.add_job(cleanup_abandoned_drafts, 'interval', hours=1)


# ── Trial-upgrade email drip (t80) ──────────────────────────────────────────
# Free apps carry a 15-day trial + watermark. Users who built one get three
# nudges keyed to the age of their FIRST successful free build: day 3 (tips +
# what paid unlocks), day 8 (midway), day 13 (trial ends in ~2 days). One send
# per (user, stage) ever — recorded in drip_emails — and paid users are always
# excluded. Capped per run + spaced out because Zoho throttles burst sends.
_DRIP_STAGES = [("day3", 3, 5), ("day8", 8, 10), ("day13", 13, 15)]
_DRIP_MAX_PER_RUN = 30

def _drip_email_html(stage: str, name: str) -> tuple[str, str]:
    first = (name or "there").split(" ")[0]
    if stage == "day3":
        return ("How is your app coming along?", f"""
<p>Hi {first},</p>
<p>You built your app with WebsiteToApp a few days ago — how is it looking on your phone?</p>
<p>A few things people often miss: you can change the app icon, splash screen and colors
anytime from your dashboard and rebuild, and features like push notifications and the
QR scanner are one toggle away.</p>
<p>When you're ready to share the app with real users, the paid plan removes the trial
limit and watermark, signs the app with its own private keystore, and includes
5 rebuilds every month — it's a one-time payment, not a subscription:
<a href="https://websitetoapp.app/pricing">see plans</a>.</p>
<p>Stuck on anything? Just reply to this email.</p>
<p>— WebsiteToApp Support</p>""")
    if stage == "day8":
        return ("Your app trial is halfway through", f"""
<p>Hi {first},</p>
<p>Your free app's 15-day trial is about halfway through. After it ends, the app shows
a trial-expired notice on launch until it's upgraded.</p>
<p>Upgrading is a one-time payment (no subscription): the watermark disappears, the
trial limit is removed, your app gets its own unique signing keystore (required for a
clean Google Play listing you control), and you get 5 rebuilds per month for updates.</p>
<p><a href="https://websitetoapp.app/pricing">Upgrade your app</a> — it takes about two
minutes and your existing app settings carry over as-is.</p>
<p>— WebsiteToApp Support</p>""")
    return ("Your app trial ends in about 2 days", f"""
<p>Hi {first},</p>
<p>A quick heads-up: your free app's 15-day trial ends in about two days. After that,
people who open the app will see a trial-expired notice instead of your website.</p>
<p>To keep the app running without interruption, upgrade once and own it forever —
one-time payment, watermark removed, your own signing keystore, and 5 rebuilds a month:
<a href="https://websitetoapp.app/pricing">upgrade now</a>.</p>
<p>If the trial already lapsed, upgrading unlocks the installed app live — no rebuild
or reinstall needed.</p>
<p>— WebsiteToApp Support</p>""")

async def send_trial_drips():
    try:
        from sqlalchemy import text
        from app.utils.email import send_email
        async with async_session() as db:
            rows = (await db.execute(text("""
                SELECT u.id, u.email, COALESCE(u.full_name, '') AS name,
                       EXTRACT(EPOCH FROM (now() - MIN(b.created_at))) / 86400.0 AS age_days
                FROM users u
                JOIN orders o ON o.user_id = u.id AND o.amount = 0 AND o.status = 'paid'
                JOIN builds b ON b.order_id = o.id AND b.status = 'success'
                WHERE NOT EXISTS (
                    SELECT 1 FROM orders p
                    WHERE p.user_id = u.id AND p.amount > 0 AND p.status = 'paid'
                )
                GROUP BY u.id, u.email, u.full_name
            """))).all()
            sent = 0
            for uid, email, name, age_days in rows:
                if sent >= _DRIP_MAX_PER_RUN:
                    break
                stage = next((s for s, lo, hi in _DRIP_STAGES if lo <= (age_days or 0) < hi), None)
                if not stage or not email:
                    continue
                already = (await db.execute(text(
                    "SELECT 1 FROM drip_emails WHERE user_id = :u AND stage = :s"
                ), {"u": str(uid), "s": stage})).first()
                if already:
                    continue
                subject, html = _drip_email_html(stage, name)
                ok = await asyncio.to_thread(send_email, email, subject, html)
                # Record the attempt either way so a hard-bouncing address is
                # never retried daily forever; email_sends.jsonl logs failures.
                await db.execute(text(
                    "INSERT INTO drip_emails (user_id, stage) VALUES (:u, :s) ON CONFLICT DO NOTHING"
                ), {"u": str(uid), "s": stage})
                await db.commit()
                logger.info(f"trial drip {stage} -> {email} (sent={ok})")
                sent += 1
                await asyncio.sleep(2)  # Zoho dislikes bursts
    except Exception as e:
        logger.error(f"send_trial_drips failed: {e}")

scheduler.add_job(send_trial_drips, 'cron', hour=5, minute=7)  # 10:37 IST daily
async def cleanup_abandoned_pending_orders():
    """Delete unpaid pending orders older than 24h (payment never completed)
    plus their app configs when nothing else references them — an abandoned
    checkout must leave nothing behind (product rule 2026-07-17)."""
    try:
        from datetime import datetime, timedelta, timezone
        from sqlalchemy import select, exists, not_
        from app.models.app_config import AppConfig
        from app.models.order import Order
        from app.models.build import Build
        async with async_session() as db:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            stale = (await db.execute(
                select(Order).where(
                    Order.status == "pending",
                    Order.amount > 0,
                    Order.gateway_payment_id.is_(None),
                    Order.created_at < cutoff,
                    not_(exists(select(Build.id).where(Build.order_id == Order.id))),
                )
            )).scalars().all()
            removed_orders, removed_configs = 0, 0
            for o in stale:
                ac_id = o.app_config_id
                await db.delete(o)
                await db.flush()
                others = (await db.execute(
                    select(Order.id).where(Order.app_config_id == ac_id).limit(1)
                )).first()
                if others is None:
                    ac = (await db.execute(select(AppConfig).where(AppConfig.id == ac_id))).scalar_one_or_none()
                    if ac:
                        await db.delete(ac)
                        removed_configs += 1
                removed_orders += 1
            await db.commit()
            if removed_orders:
                logger.info(f"cleanup_abandoned_pending_orders: removed {removed_orders} orders, {removed_configs} configs")
    except Exception as e:
        logger.error(f"cleanup_abandoned_pending_orders failed: {e}")

scheduler.add_job(cleanup_abandoned_pending_orders, 'interval', hours=1)

scheduler.add_job(process_pending_build, 'interval', minutes=1)
scheduler.add_job(sync_active_builds, 'interval', minutes=1)

def start_scheduler():
    scheduler.start()
    logger.info("Started cron scheduler for pending builds and active build sync")
