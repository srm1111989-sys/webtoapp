import uuid
import httpx
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from app.services.github_service import GitHubService
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, cast, Date
from app.database import get_db
from app.models.admin import Admin
from app.models.user import User
from app.models.order import Order
from app.models.build import Build
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.app_config import AppConfig
from app.models.setting import Setting
from app.models.subscription import Subscription
from app.schemas.auth import LoginRequest, TokenResponse, MessageResponse
from app.schemas.user import UserResponse, UserListResponse
from app.schemas.order import OrderResponse, OrderListResponse, OrderDetailResponse
from app.schemas.build import BuildResponse
from app.schemas.plan import PlanResponse, PlanCreate, PlanUpdate
from app.dependencies import get_current_admin
from app.utils.security import verify_password, create_access_token, create_refresh_token, hash_password
from app.utils.email import send_playstore_announcement
from app.services.build_service import trigger_build
from app.rate_limit import limiter

LOG_DIR = Path("/app/logs/builds")

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def admin_login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admin).where(Admin.email == data.email))
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    token_data = {"sub": str(admin.id), "email": admin.email, "role": "admin"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# --- Dashboard Stats ---
@router.get("/stats")
async def get_stats(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    users_count = (await db.execute(select(func.count()).select_from(User))).scalar()
    orders_count = (await db.execute(select(func.count()).select_from(Order))).scalar()

    revenue_inr = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == "captured", Payment.currency == "INR")
    )).scalar()

    revenue_usd = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == "captured", Payment.currency == "USD")
    )).scalar()

    builds_by_status = {}
    result = await db.execute(
        select(Build.status, func.count()).group_by(Build.status)
    )
    for row in result.all():
        builds_by_status[row[0]] = row[1]

    return {
        "users": users_count,
        "orders": orders_count,
        "revenue_inr": revenue_inr,
        "revenue_usd": revenue_usd,
        "builds": builds_by_status,
    }


@router.get("/ci-quota")
async def get_ci_quota(admin: Admin = Depends(get_current_admin)):
    """Return real-time CI quota status (used vs remaining minutes, artifact storage) for all 4 GitHub Actions accounts."""
    providers = []
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    for acct_num in (1, 2, 3, 4):
        try:
            gh = GitHubService(platform="android", account=acct_num)
            has_token = bool(gh.token)
            quota_ok = gh.has_quota() if has_token else False

            storage_mb = 0.0
            used_minutes = 0
            max_minutes = 2000
            runs_count_this_month = 0

            if has_token:
                try:
                    with httpx.Client(timeout=8) as client:
                        # 1. Fetch artifacts storage
                        r_art = client.get(
                            f"https://api.github.com/repos/{gh.repo}/actions/artifacts?per_page=100",
                            headers=gh.headers,
                        )
                        if r_art.status_code == 200:
                            artifacts = r_art.json().get("artifacts", [])
                            storage_mb = round(sum(a.get("size_in_bytes", 0) for a in artifacts) / (1024 * 1024), 1)

                        # 2. Fetch workflow runs to compute billable execution minutes this month
                        r_runs = client.get(
                            f"https://api.github.com/repos/{gh.repo}/actions/runs?per_page=100",
                            headers=gh.headers,
                        )
                        if r_runs.status_code == 200:
                            runs = r_runs.json().get("workflow_runs", [])
                            total_duration_sec = 0.0
                            for run in runs:
                                created_str = run.get("run_started_at") or run.get("created_at")
                                if created_str:
                                    created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                                    if created_dt >= month_start:
                                        runs_count_this_month += 1
                                        updated_str = run.get("updated_at") or created_str
                                        updated_dt = datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
                                        duration = max(0.0, (updated_dt - created_dt).total_seconds())
                                        total_duration_sec += duration
                            used_minutes = round(total_duration_sec / 60.0)
                except Exception:
                    pass

            remaining_minutes = max(0, max_minutes - used_minutes) if has_token else 0
            if not quota_ok and has_token:
                status_text = "Quota Exhausted"
            elif quota_ok:
                status_text = "Active (Healthy)"
            elif not has_token:
                status_text = "No Token"
            else:
                status_text = "Inactive"

            providers.append({
                "id": f"github{acct_num}",
                "name": f"GitHub Actions #{acct_num}",
                "repo": gh.repo or f"account-{acct_num}",
                "configured": has_token,
                "has_quota": quota_ok,
                "used_minutes": used_minutes,
                "remaining_minutes": remaining_minutes,
                "max_minutes": max_minutes,
                "runs_this_month": runs_count_this_month,
                "storage_mb": storage_mb,
                "max_storage_mb": 500.0,
                "status": status_text,
            })
        except Exception as e:
            providers.append({
                "id": f"github{acct_num}",
                "name": f"GitHub Actions #{acct_num}",
                "repo": f"account-{acct_num}",
                "configured": False,
                "has_quota": False,
                "used_minutes": 0,
                "remaining_minutes": 0,
                "max_minutes": 2000,
                "runs_this_month": 0,
                "storage_mb": 0.0,
                "max_storage_mb": 500.0,
                "status": f"Error: {str(e)}"
            })

    total_used_minutes = sum(p["used_minutes"] for p in providers)
    total_remaining_minutes = sum(p["remaining_minutes"] for p in providers)
    total_max_minutes = sum(p["max_minutes"] for p in providers if p["configured"])

    return {
        "providers": providers,
        "total_used_minutes": total_used_minutes,
        "total_remaining_minutes": total_remaining_minutes,
        "total_max_minutes": total_max_minutes,
    }



# --- Users Management ---
GITHUB_ANDROID_URL = "https://github.com/pallavimokashi94-sys/webtoapp/actions"
GITHUB_DESKTOP_URL = "https://github.com/pallavimokashi94-sys/webtoapp/actions"

@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import text
    query = select(User)
    count_query = select(func.count()).select_from(User)

    if search:
        query = query.where(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
        count_query = count_query.where(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(
        query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    users = result.scalars().all()

    # Fetch latest build per user in one query
    if users:
        user_ids = [str(u.id) for u in users]
        placeholders = ",".join(f"'{uid}'" for uid in user_ids)
        builds_result = await db.execute(text(f"""
            SELECT DISTINCT ON (ac.user_id) ac.user_id, b.pipeline_id, b.apk_url, b.platform
            FROM app_configs ac
            JOIN orders o ON o.app_config_id = ac.id
            JOIN builds b ON b.order_id = o.id
            WHERE ac.user_id IN ({placeholders}) AND b.status = 'success'
            ORDER BY ac.user_id, b.created_at DESC
        """))
        build_map = {str(row.user_id): row for row in builds_result}
        for u in users:
            row = build_map.get(str(u.id))
            if row:
                u.__dict__['pipeline_id'] = row.pipeline_id
                u.__dict__['apk_url'] = row.apk_url
                base = GITHUB_DESKTOP_URL if row.platform == 'desktop' else GITHUB_ANDROID_URL
                u.__dict__['pipeline_url'] = f"{base}/-/pipelines/{row.pipeline_id}" if row.pipeline_id else None

    return UserListResponse(users=users, total=total, page=page, per_page=per_page)


@router.put("/users/{user_id}/status", response_model=MessageResponse)
async def update_user_status(
    user_id: uuid.UUID,
    is_active: bool,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = is_active
    action = "activated" if is_active else "banned"
    return {"message": f"User {action} successfully"}


@router.put("/users/{user_id}/test-mode", response_model=MessageResponse)
async def toggle_user_test_mode(
    user_id: uuid.UUID,
    enable: bool,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    setting_key = f"user_test_mode:{user_id}"
    result = await db.execute(select(Setting).where(Setting.key == setting_key))
    setting = result.scalar_one_or_none()

    if enable:
        if setting:
            setting.value = "true"
        else:
            db.add(Setting(key=setting_key, value="true", description=f"Test mode for user {user.email}"))
    else:
        if setting:
            setting.value = "false"

    action = "enabled" if enable else "disabled"
    return {"message": f"Test mode {action} for {user.email}"}


@router.get("/users/{user_id}/test-mode")
async def get_user_test_mode(
    user_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    setting_key = f"user_test_mode:{user_id}"
    result = await db.execute(select(Setting).where(Setting.key == setting_key))
    setting = result.scalar_one_or_none()
    enabled = setting is not None and setting.value.lower() in ("true", "1", "yes")
    return {"user_id": str(user_id), "test_mode": enabled}


# --- Orders Management ---
@router.get("/orders", response_model=OrderListResponse)
async def list_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order)
    count_query = select(func.count()).select_from(Order)

    if status_filter:
        query = query.where(Order.status == status_filter)
        count_query = count_query.where(Order.status == status_filter)

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(
        query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    orders = result.scalars().all()
    return OrderListResponse(orders=orders, total=total, page=page, per_page=per_page)


@router.post("/orders/{order_id}/rebuild", response_model=BuildResponse)
async def force_rebuild(
    order_id: uuid.UUID,
    force_premium: bool = Query(False, description="Build as premium (no watermark/trial, AAB + keystore) even if the order amount is 0 — for share-for-upgrade rewards"),
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if force_premium:
        order.order_metadata = {**(order.order_metadata or {}), "force_premium": True}
        await db.commit()

    build = await trigger_build(order_id, db)
    return build


# --- Builds Management ---
@router.get("/builds", response_model=list[BuildResponse])
async def list_all_builds(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Build)
    if status_filter:
        query = query.where(Build.status == status_filter)

    result = await db.execute(
        query.order_by(Build.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    return result.scalars().all()


# --- Plans Management ---
@router.get("/plans", response_model=list[PlanResponse])
async def list_all_plans(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Plan).order_by(Plan.sort_order))
    return result.scalars().all()


@router.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    data: PlanCreate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return plan


@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    data: PlanUpdate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)
    await db.flush()
    await db.refresh(plan)
    return plan


# --- Settings Management ---
@router.get("/settings")
async def get_settings_list(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from app.config import get_settings as get_app_settings
    app_settings = get_app_settings()

    # Keys that the admin UI manages
    env_keys = [
        "razorpay_key_id", "razorpay_key_secret",
        "razorpay_test_key_id", "razorpay_test_key_secret",
        "stripe_publishable_key", "stripe_secret_key",
        "stripe_test_publishable_key", "stripe_test_secret_key",
        "smtp_host", "smtp_port", "smtp_user", "smtp_password",
        "google_client_id", "payment_test_mode",
    ]

    # Start with .env defaults
    defaults = {}
    for key in env_keys:
        val = getattr(app_settings, key, "")
        defaults[key] = str(val) if val else ""

    # DB values override .env defaults
    result = await db.execute(select(Setting).order_by(Setting.key))
    for s in result.scalars().all():
        defaults[s.key] = s.value

    return defaults


@router.put("/settings", response_model=MessageResponse)
async def update_settings(
    data: dict,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    for key, value in data.items():
        result = await db.execute(select(Setting).where(Setting.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = str(value)
        else:
            db.add(Setting(key=key, value=str(value)))
    return {"message": "Settings updated successfully"}


# --- Payments Management ---
@router.get("/payments", response_model=list)
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).order_by(Payment.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    return result.scalars().all()


# --- Build Logs ---
@router.get("/builds/{build_id}/log")
async def get_build_log(
    build_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Build).where(Build.id == build_id))
    build = result.scalar_one_or_none()
    if not build:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Build not found")

    # Try DB log first, then file
    log_content = build.log
    if not log_content:
        log_file = LOG_DIR / f"{build_id}.log"
        if log_file.exists():
            log_content = log_file.read_text(encoding="utf-8")

    return {
        "build_id": str(build.id),
        "status": build.status,
        "error_message": build.error_message,
        "log": log_content or "No log available.",
    }


# --- Enhanced Stats ---
@router.get("/stats/enhanced")
async def get_enhanced_stats(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Basic counts
    users_count = (await db.execute(select(func.count()).select_from(User))).scalar()
    orders_count = (await db.execute(select(func.count()).select_from(Order))).scalar()

    # Revenue
    revenue_inr = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == "captured", Payment.currency == "INR")
    )).scalar()
    revenue_usd = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == "captured", Payment.currency == "USD")
    )).scalar()

    # Builds by status
    builds_by_status = {}
    result = await db.execute(
        select(Build.status, func.count()).group_by(Build.status)
    )
    for row in result.all():
        builds_by_status[row[0]] = row[1]

    total_builds = sum(builds_by_status.values())
    failed_builds = builds_by_status.get("failed", 0)
    failure_rate = round((failed_builds / total_builds * 100), 1) if total_builds > 0 else 0

    # Recent failed builds (last 10)
    result = await db.execute(
        select(Build)
        .where(Build.status == "failed")
        .order_by(Build.completed_at.desc())
        .limit(10)
    )
    recent_failures = result.scalars().all()

    # Get app names for failed builds
    failed_builds_data = []
    for b in recent_failures:
        # Get order -> app_config name
        order_result = await db.execute(select(Order).where(Order.id == b.order_id))
        order = order_result.scalar_one_or_none()
        app_name = None
        if order:
            config_result = await db.execute(select(AppConfig).where(AppConfig.id == order.app_config_id))
            config = config_result.scalar_one_or_none()
            app_name = config.name if config else None

        failed_builds_data.append({
            "id": str(b.id),
            "order_id": str(b.order_id),
            "platform": b.platform,
            "error_message": b.error_message,
            "completed_at": b.completed_at.isoformat() if b.completed_at else None,
            "app_name": app_name,
        })

    # Daily revenue (last 30 days)
    daily_revenue = []
    result = await db.execute(
        select(
            cast(Payment.created_at, Date).label("date"),
            Payment.currency,
            func.sum(Payment.amount).label("total"),
        )
        .where(Payment.status == "captured", Payment.created_at >= thirty_days_ago)
        .group_by(cast(Payment.created_at, Date), Payment.currency)
        .order_by(cast(Payment.created_at, Date))
    )
    for row in result.all():
        daily_revenue.append({
            "date": row.date.isoformat(),
            "currency": row.currency,
            "total": row.total,
        })

    # Builds per day (last 30 days)
    daily_builds = []
    result = await db.execute(
        select(
            cast(Build.created_at, Date).label("date"),
            Build.status,
            func.count().label("count"),
        )
        .where(Build.created_at >= thirty_days_ago)
        .group_by(cast(Build.created_at, Date), Build.status)
        .order_by(cast(Build.created_at, Date))
    )
    for row in result.all():
        daily_builds.append({
            "date": row.date.isoformat(),
            "status": row.status,
            "count": row.count,
        })

    # Active subscriptions (monthly plans with paid orders)
    active_subs = (await db.execute(
        select(func.count())
        .select_from(Order)
        .join(Plan, Order.plan_id == Plan.id)
        .where(Order.status == "paid", Plan.billing_type == "monthly")
    )).scalar()

    return {
        "users": users_count,
        "orders": orders_count,
        "revenue_inr": revenue_inr,
        "revenue_usd": revenue_usd,
        "builds": builds_by_status,
        "total_builds": total_builds,
        "failed_builds": failed_builds,
        "failure_rate": failure_rate,
        "active_subscriptions": active_subs,
        "recent_failures": failed_builds_data,
        "daily_revenue": daily_revenue,
        "daily_builds": daily_builds,
    }


@router.post("/send-playstore-announcement", response_model=dict)
async def send_playstore_announcement_email(
    _: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send Play Store publishing announcement to all verified users with their recent build info."""
    # Get all active verified users
    users_result = await db.execute(
        select(User).where(User.is_active == True, User.is_verified == True)
    )
    users = users_result.scalars().all()

    # Get most recent successful build per user (apk_url + app name via order -> app_config)
    from app.models.app_config import AppConfig
    recent_builds_result = await db.execute(
        select(User.id, AppConfig.name, Build.apk_url).select_from(
            User.__table__
            .join(Order.__table__, Order.user_id == User.id)
            .join(AppConfig.__table__, AppConfig.id == Order.app_config_id)
            .join(Build.__table__, Build.order_id == Order.id)
        ).where(
            Build.status == "success",
            Build.apk_url.isnot(None),
        ).distinct(User.id).order_by(User.id, Build.created_at.desc())
    )
    build_map: dict[str, tuple[str, str]] = {}
    for row in recent_builds_result:
        uid = str(row[0])
        if uid not in build_map:
            build_map[uid] = (row[1], row[2])  # (app_name, apk_url)

    import time
    sent = 0
    failed = 0
    for i, user in enumerate(users):
        uid = str(user.id)
        app_name, apk_url = build_map.get(uid, (None, None))
        user_name = user.email.split("@")[0]
        ok = send_playstore_announcement(
            to=user.email,
            user_name=user_name,
            recent_app_name=app_name,
            recent_apk_url=apk_url,
        )
        if ok:
            sent += 1
        else:
            failed += 1
        if (i + 1) % 5 == 0:
            time.sleep(2)

    return {"sent": sent, "failed": failed, "total": len(users)}
