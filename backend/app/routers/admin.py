import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.database import get_db
from app.models.admin import Admin
from app.models.user import User
from app.models.order import Order
from app.models.build import Build
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.setting import Setting
from app.schemas.auth import LoginRequest, TokenResponse, MessageResponse
from app.schemas.user import UserResponse, UserListResponse
from app.schemas.order import OrderResponse, OrderListResponse, OrderDetailResponse
from app.schemas.build import BuildResponse
from app.schemas.plan import PlanResponse, PlanCreate, PlanUpdate
from app.dependencies import get_current_admin
from app.utils.security import verify_password, create_access_token, create_refresh_token, hash_password
from app.services.build_service import trigger_build

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=TokenResponse)
async def admin_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
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
@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
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
    result = await db.execute(select(Setting).order_by(Setting.key))
    settings_list = result.scalars().all()
    return {s.key: s.value for s in settings_list}


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
