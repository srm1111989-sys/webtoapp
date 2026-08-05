import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.build import Build
from app.models.plan import Plan
from app.models.app_config import AppConfig
from app.models.promo_code import PromoCode
from app.schemas.order import OrderCreate, OrderResponse, OrderDetailResponse, OrderListResponse
from app.dependencies import get_current_user, team_access
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

    # One free build per user, lifetime (successful builds only — failures
    # never consume it). Once used, every new app/order must be paid.
    if amount == 0:
        used = await db.execute(
            select(func.count(Build.id))
            .join(Order, Build.order_id == Order.id)
            .where(Order.user_id == user.id, Order.amount == 0, Build.status == "success")
        )
        if (used.scalar() or 0) >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your free build is already used. Choose a paid plan to build this app.",
            )

    # Apply promo code if provided
    promo_applied = None
    referred_by_id = None
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
                # NOT consumed here (2026-08-05, Lovasecond report): incrementing
                # current_uses at order creation burned single-use codes on FAILED
                # payments. The use is now recorded only when the order is PAID
                # (consume_promo_for_paid_order, called from every success path).
                promo_applied = promo.code.upper()
        if not promo_applied:
            # Not a promo code — maybe another user's referral code (REF-XXXXXX):
            # friend gets 10% off, referrer earns bonus rebuilds when this pays.
            from app.services.referrals import find_referrer_by_code, REFERRAL_DISCOUNT_PERCENT
            referrer = await find_referrer_by_code(db, data.promo_code)
            if referrer and referrer.id != user.id:
                discount = int(amount * REFERRAL_DISCOUNT_PERCENT / 100)
                amount = max(0, amount - discount)
                promo_applied = referrer.referral_code
                referred_by_id = referrer.id

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
        referred_by_user_id=referred_by_id,
        # Carried so the promo use can be recorded at PAYMENT time.
        order_metadata={"promo_code": promo_applied} if promo_applied else None,
    )

    # Free plan: mark as paid immediately
    if amount == 0:
        order.status = "paid"
        order.payment_gateway = "free"

    db.add(order)
    await db.flush()
    await db.refresh(order)

    # A promo that discounted the order to 0 is "paid" right now — record the
    # use immediately (there is no later payment step to do it).
    if amount == 0 and promo_applied:
        from app.services.promo import consume_promo_for_paid_order
        await consume_promo_for_paid_order(db, order)

    # Promote app out of draft so it appears in My Apps immediately after order creation
    ac_result = await db.execute(select(AppConfig).where(AppConfig.id == data.app_config_id))
    ac = ac_result.scalar_one_or_none()
    if ac and ac.status == "draft":
        ac.status = "active"

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
    # Own orders + orders from workspaces shared with this user (team access)
    access = await team_access(user, db)
    access_ids = list(access.keys())
    count_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.user_id.in_(access_ids))
    )
    total = count_result.scalar()

    result = await db.execute(
        select(Order)
        .where(Order.user_id.in_(access_ids))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    orders = result.scalars().all()

    # Per-order build stats in one query: non-failed count, first success,
    # and successful builds this calendar month (drives plan_state + rebuild meter).
    from datetime import datetime, timezone, timedelta
    order_ids = [o.id for o in orders]
    build_counts: dict = {}
    first_success: dict = {}
    month_success: dict = {}
    latest_build: dict = {}
    if order_ids:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        bc_result = await db.execute(
            select(
                Build.order_id,
                func.count(Build.id).filter(Build.status != "failed"),
                func.min(Build.created_at).filter(Build.status == "success"),
                func.count(Build.id).filter(Build.status == "success", Build.created_at >= month_start),
            )
            .where(Build.order_id.in_(order_ids))
            .group_by(Build.order_id)
        )
        for oid, n, first, month_n in bc_result.all():
            build_counts[oid] = n
            first_success[oid] = first
            month_success[oid] = month_n

        # Latest build per order (status + progress) for dashboard/build pipeline
        latest_rows = (await db.execute(
            select(Build.order_id, Build.status, Build.progress, Build.created_at)
            .where(Build.order_id.in_(order_ids))
            .order_by(Build.order_id, Build.created_at.desc())
            .distinct(Build.order_id)
        )).all()
        latest_build = {r[0]: r for r in latest_rows}

    TRIAL_DAYS = 15
    REBUILDS_PER_MONTH = 5
    order_responses = []
    for order in orders:
        resp = OrderResponse.model_validate(order)
        if order.plan:
            resp.plan_name = order.plan.name
        if order.app_config:
            resp.app_name = order.app_config.name
            resp.selected_platforms = order.app_config.selected_platforms
            resp.app_url = order.app_config.url
        resp.build_count = build_counts.get(order.id, 0)
        lb = latest_build.get(order.id)
        if lb is not None:
            resp.latest_build_status = lb[1]
            resp.latest_build_progress = lb[2]
            resp.latest_build_at = lb[3]

        first = first_success.get(order.id)
        if order.status == "pending":
            resp.plan_state = "pending_payment"
        elif order.amount > 0:
            resp.plan_state = "paid"
            used = month_success.get(order.id, 0)
            # The order's first-ever successful build doesn't count as a
            # "modification" — only rebuilds after it do.
            if first is not None and first >= month_start:
                used = max(0, used - 1)
            resp.rebuilds_left_this_month = max(0, REBUILDS_PER_MONTH - used)
        else:
            if first is None:
                resp.plan_state = "free_unbuilt"
            else:
                elapsed = (datetime.now(timezone.utc) - first).days
                left = TRIAL_DAYS - elapsed
                if left > 0:
                    resp.plan_state = "free_trial"
                    resp.trial_days_left = left
                else:
                    resp.plan_state = "free_expired"
                    resp.trial_days_left = 0
        order_responses.append(resp)

    return OrderListResponse(orders=order_responses, total=total, page=page, per_page=per_page)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_pending_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an unpaid pending order (user backed out of payment).

    Abandoned payments must leave nothing behind (product rule 2026-07-17):
    the pending order is deleted, and if its app config has no other orders
    it is deleted too (it was a wizard run that never became an app).
    Only pending, build-less, unpaid orders can be cancelled.
    """
    order = (await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    )).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != "pending" or order.gateway_payment_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only unpaid pending orders can be cancelled")
    has_builds = (await db.execute(
        select(func.count(Build.id)).where(Build.order_id == order.id)
    )).scalar() or 0
    if has_builds:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order has builds and cannot be cancelled")

    ac_id = order.app_config_id
    await db.delete(order)
    await db.flush()
    remaining = (await db.execute(
        select(func.count(Order.id)).where(Order.app_config_id == ac_id)
    )).scalar() or 0
    if remaining == 0:
        ac = (await db.execute(select(AppConfig).where(AppConfig.id == ac_id))).scalar_one_or_none()
        if ac:
            await db.delete(ac)
    return None


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    access = await team_access(user, db)
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id.in_(list(access.keys())))
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

    # Inject keystore credentials from build variables so users can see them
    for build_resp, build_obj in zip(response.builds, order.builds):
        if build_obj.variables:
            v = build_obj.variables if isinstance(build_obj.variables, dict) else {}
            build_resp.keystore_password = v.get("CUSTOM_KEYSTORE_PASSWORD") or v.get("KEYSTORE_PASSWORD")
            build_resp.keystore_alias = v.get("CUSTOM_KEYSTORE_ALIAS") or v.get("KEY_ALIAS")

    return response
