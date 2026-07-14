from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from pathlib import Path
from starlette.responses import FileResponse
from app.config import get_settings
from app.middleware.logging import RequestLoggingMiddleware
from app.rate_limit import limiter
from app.routers import auth, users, apps, orders, payments, builds, webhooks, admin, plans, blog, seo, promo, client_errors, support, chatbot, app_events
from app.utils.email import send_admin_payment_notification as _admin_notify

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
)

from app.cron import start_scheduler

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    # Column migrations — safe to run on every restart
    from app.database import engine
    from sqlalchemy import text
    async with engine.begin() as conn:
        for sql in [
            "ALTER TABLE app_configs ADD COLUMN IF NOT EXISTS version_code INTEGER",
            # Free-app telemetry (open events). Idempotent create on every boot.
            """CREATE TABLE IF NOT EXISTS app_events (
                id UUID PRIMARY KEY,
                order_id INTEGER,
                event VARCHAR(40) NOT NULL DEFAULT 'app_open',
                device_id VARCHAR(64),
                package VARCHAR(255),
                app_version VARCHAR(30),
                platform VARCHAR(16) DEFAULT 'android',
                ip_address VARCHAR(45),
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )""",
            "CREATE INDEX IF NOT EXISTS ix_app_events_order_id ON app_events(order_id)",
            "CREATE INDEX IF NOT EXISTS ix_app_events_device_id ON app_events(device_id)",
            "CREATE INDEX IF NOT EXISTS ix_app_events_created_at ON app_events(created_at)",
            "CREATE INDEX IF NOT EXISTS ix_app_events_order_created ON app_events(order_id, created_at)",
        ]:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                pass


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.app_url,
        "https://websitetoapp.app",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(apps.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(builds.router)
app.include_router(webhooks.router)
app.include_router(webhooks.razorpay_compat_router)
app.include_router(plans.router)
app.include_router(admin.router)
app.include_router(blog.router)
app.include_router(seo.router)
app.include_router(promo.router)
app.include_router(client_errors.router)
app.include_router(support.router)
app.include_router(chatbot.router)
app.include_router(app_events.router)


# Serve local artifacts when S3 is not configured.
# Subclassed StaticFiles sets correct MIME + Content-Disposition: attachment
# so browsers download .apk/.aab/.exe/.ipa instead of inline-rendering as text/plain.
class ArtifactStaticFiles(StaticFiles):
    _MIME_BY_EXT = {
        ".apk": "application/vnd.android.package-archive",
        ".aab": "application/octet-stream",
        ".exe": "application/vnd.microsoft.portable-executable",
        ".ipa": "application/octet-stream",
        ".dmg": "application/x-apple-diskimage",
        ".zip": "application/zip",
    }

    def file_response(self, full_path, stat_result, scope, status_code=200):
        ext = Path(full_path).suffix.lower()
        media_type = self._MIME_BY_EXT.get(ext)
        if media_type:
            return FileResponse(
                full_path,
                media_type=media_type,
                stat_result=stat_result,
                filename=Path(full_path).name,
                status_code=status_code,
            )
        return super().file_response(full_path, stat_result, scope, status_code)


artifacts_dir = Path("/app/storage/artifacts")
artifacts_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/artifacts", ArtifactStaticFiles(directory=str(artifacts_dir)), name="artifacts")


@app.get("/api/health")
async def health():
    checks = {}
    healthy = True

    # DB
    try:
        from app.database import async_session
        async with async_session() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"fail: {str(e)[:80]}"
        healthy = False


    # Stuck builds
    try:
        from app.database import async_session
        async with async_session() as db:
            result = await db.execute(text(
                "SELECT count(*) FROM builds WHERE status IN ('building','pending') "
                "AND created_at < NOW() - INTERVAL '30 minutes'"
            ))
            stuck = result.scalar()
            checks["stuck_builds"] = str(stuck)
            if stuck > 0:
                healthy = False
    except:
        checks["stuck_builds"] = "unknown"

    # Failed builds (last 24 hours)
    try:
        from app.database import async_session
        async with async_session() as db:
            result = await db.execute(text(
                "SELECT count(*) FROM builds WHERE status = 'failed' "
                "AND created_at > NOW() - INTERVAL '24 hours'"
            ))
            checks["failed_builds_24h"] = str(result.scalar())
    except:
        checks["failed_builds_24h"] = "unknown"

    # Disk
    try:
        import shutil
        total, used, free = shutil.disk_usage("/")
        pct = int(used / total * 100)
        checks["disk"] = f"{pct}%"
        if pct > 85:
            healthy = False
    except:
        checks["disk"] = "unknown"

    return {
        "status": "healthy" if healthy else "degraded",
        "service": "webtoapp",
        "checks": checks,
    }
