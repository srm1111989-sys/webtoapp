from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "WebToApp"
    app_url: str = "http://localhost:5173"
    api_url: str = "http://localhost:8000"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://webtoapp:webtoapp@db:5432/webtoapp"
    database_url_sync: str = "postgresql://webtoapp:webtoapp@db:5432/webtoapp"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 30

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "support@websitetoapp.app"
    smtp_from_name: str = "WebToApp"

    # Razorpay (live)
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # Razorpay (test)
    razorpay_test_key_id: str = ""
    razorpay_test_key_secret: str = ""

    # Stripe (live)
    stripe_publishable_key: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Stripe (test)
    stripe_test_publishable_key: str = ""
    stripe_test_secret_key: str = ""

    # GitLab
    gitlab_url: str = "https://gitlab.com"
    gitlab_token: str = ""
    gitlab_project_id: str = ""
    gitlab_android_project_id: str = ""
    gitlab_desktop_project_id: str = ""

    # GitHub fallback (when GitLab CI quota exceeded)
    github_token: str = ""
    github_repo: str = "mokashiswapnil/webtoapp"

    # S3/R2
    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "webtoapp"
    s3_region: str = "auto"
    s3_public_url: str = ""

    # Firebase
    firebase_credentials_json: str = ""

    # Sentry
    sentry_dsn: str = ""

    # Google OAuth
    google_client_id: str = ""

    # Admin
    admin_email: str = "admin@websitetoapp.app"
    admin_password: str = "admin123"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
