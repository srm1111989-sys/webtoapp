import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
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


# --- Users Management ---
GITLAB_ANDROID_URL = "https://gitlab.com/mokashiswapnil11/webtoapp-android-template"
GITLAB_DESKTOP_URL = "https://gitlab.com/mokashiswapnil11/webtoapp-desktop-template"

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
                base = GITLAB_DESKTOP_URL if row.platform == 'desktop' else GITLAB_ANDROID_URL
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
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

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
        "gitlab_url", "gitlab_token", "gitlab_project_id",
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
