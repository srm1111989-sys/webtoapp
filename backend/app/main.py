from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from pathlib import Path
from app.config import get_settings
from app.middleware.logging import RequestLoggingMiddleware
from app.rate_limit import limiter
from app.routers import auth, users, apps, orders, payments, builds, webhooks, admin, plans, blog, seo, promo, client_errors, support
from app.utils.email import send_admin_payment_notification as _admin_notify

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(plans.router)
app.include_router(admin.router)
app.include_router(blog.router)
app.include_router(seo.router)
app.include_router(promo.router)
app.include_router(client_errors.router)
app.include_router(support.router)


# Serve local artifacts when S3 is not configured
artifacts_dir = Path("/app/storage/artifacts")
artifacts_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/artifacts", StaticFiles(directory=str(artifacts_dir)), name="artifacts")


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

    # Redis
    try:
        import redis
        r = redis.Redis(host="redis", port=6379, socket_timeout=2)
        r.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"fail: {str(e)[:80]}"
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
