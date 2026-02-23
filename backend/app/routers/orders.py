import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.plan import Plan
from app.models.app_config import AppConfig
from app.schemas.order import OrderCreate, OrderResponse, OrderDetailResponse, OrderListResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/orders", tags=["orders"])


def generate_order_number() -> str:
    return f"WTA-{secrets.token_hex(4).upper()}"


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify app belongs to user
    result = await db.execute(
        select(AppConfig).where(AppConfig.id == data.app_config_id, AppConfig.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    # Get plan
    result = await db.execute(select(Plan).where(Plan.id == data.plan_id, Plan.is_active == True))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    amount = plan.price_inr if data.currency == "INR" else plan.price_usd

    order = Order(
        user_id=user.id,
        app_config_id=data.app_config_id,
        plan_id=data.plan_id,
        order_number=generate_order_number(),
        amount=amount,
        currency=data.currency,
        payment_gateway=data.payment_gateway,
    )

    # Free plan: mark as paid immediately
    if amount == 0:
        order.status = "paid"
        order.payment_gateway = "free"

    db.add(order)
    await db.flush()
    await db.refresh(order)
    return order


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.user_id == user.id)
    )
    total = count_result.scalar()

    result = await db.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    orders = result.scalars().all()

    order_responses = []
    for order in orders:
        resp = OrderResponse.model_validate(order)
        if order.plan:
            resp.plan_name = order.plan.name
        if order.app_config:
            resp.app_name = order.app_config.name
            resp.selected_platforms = order.app_config.selected_platforms
        order_responses.append(resp)

    return OrderListResponse(orders=order_responses, total=total, page=page, per_page=per_page)


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    response = OrderDetailResponse.model_validate(order)
    if order.plan:
        response.plan_name = order.plan.name
    if order.app_config:
        response.app_name = order.app_config.name
        response.selected_platforms = order.app_config.selected_platforms
    return response
