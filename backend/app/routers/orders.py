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
from app.models.promo_code import PromoCode
from app.schemas.order import OrderCreate, OrderResponse, OrderDetailResponse, OrderListResponse
from app.dependencies import get_current_user
from app.config import get_settings
from app.utils.email import send_order_confirmation_email, send_admin_payment_notification

settings = get_settings()

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

    # Apply promo code if provided
    promo_applied = None
    if data.promo_code and amount > 0:
        from datetime import datetime, timezone
        from sqlalchemy import func as sqlfunc
        promo_result = await db.execute(
            select(PromoCode).where(
                sqlfunc.upper(PromoCode.code) == data.promo_code.upper().strip(),
                PromoCode.is_active == True,
            )
        )
        promo = promo_result.scalar_one_or_none()
        if promo:
            valid = True
            if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
                valid = False
            if promo.max_uses > 0 and promo.current_uses >= promo.max_uses:
                valid = False
            if valid:
                discount = int(amount * promo.discount_percent / 100)
                amount = max(0, amount - discount)
                promo.current_uses += 1
                promo_applied = promo.code.upper()

    # If frontend requested Stripe but it is not configured, fall back to Razorpay
    gateway = data.payment_gateway
    if gateway == "stripe" and not (settings.stripe_publishable_key and settings.stripe_secret_key):
        gateway = "razorpay"

    # Clean up any stale pending orders for this app before creating a new one
    stale = await db.execute(
        select(Order).where(
            Order.app_config_id == data.app_config_id,
            Order.user_id == user.id,
            Order.status == "pending",
        )
    )
    for stale_order in stale.scalars().all():
        await db.delete(stale_order)

    order = Order(
        user_id=user.id,
        app_config_id=data.app_config_id,
        plan_id=data.plan_id,
        order_number=generate_order_number(),
        amount=amount,
        currency=data.currency,
        payment_gateway=gateway,
    )

    # Free plan: mark as paid immediately
    if amount == 0:
        order.status = "paid"
        order.payment_gateway = "free"

    db.add(order)
    await db.flush()
    await db.refresh(order)

    # Only send confirmation email for free plans — paid plans send after payment verified
    if amount == 0:
        app_name = order.app_config.name if order.app_config else "App"
        plan_name = order.plan.name if order.plan else "Plan"
        send_order_confirmation_email(
            to=user.email,
            order_number=order.order_number,
            app_name=app_name,
            plan_name=plan_name,
            amount=order.amount,
            currency=order.currency,
            order_id=str(order.id),
        )
        send_admin_payment_notification(
            order_number=order.order_number,
            customer_email=user.email,
            app_name=app_name,
            plan_name=plan_name,
            amount=order.amount,
            currency=order.currency,
            order_id=str(order.id),
        )

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
