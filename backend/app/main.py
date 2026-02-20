from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
from app.config import get_settings
from app.middleware.logging import RequestLoggingMiddleware
from app.routers import auth, users, apps, orders, payments, builds, webhooks, admin, plans

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

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
    allow_origins=[settings.app_url, "http://localhost:5173"],
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


# Serve local artifacts when S3 is not configured
artifacts_dir = Path("/app/storage/artifacts")
artifacts_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/artifacts", StaticFiles(directory=str(artifacts_dir)), name="artifacts")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
