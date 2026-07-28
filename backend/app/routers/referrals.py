from fastapi import APIRouter, Depends
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.order import Order
from app.models.referral_reward import ReferralReward
from app.models.user import User
from app.dependencies import get_current_user
from app.services.referrals import (
    ensure_referral_code,
    bonus_rebuilds_for_month,
    REFERRAL_DISCOUNT_PERCENT,
    REWARD_REBUILDS_EACH,
    MAX_REWARDS_PER_MONTH,
)

router = APIRouter(prefix="/api/referrals", tags=["referrals"])


@router.get("/me")
async def my_referrals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code = await ensure_referral_code(db, user)
    referred_orders = (await db.execute(
        select(sqlfunc.count(Order.id)).where(Order.referred_by_user_id == user.id)
    )).scalar() or 0
    converted = (await db.execute(
        select(sqlfunc.count(ReferralReward.id)).where(ReferralReward.referrer_user_id == user.id)
    )).scalar() or 0
    bonus_now = await bonus_rebuilds_for_month(db, user.id)
    return {
        "code": code,
        "discount_percent": REFERRAL_DISCOUNT_PERCENT,
        "reward_rebuilds_each": REWARD_REBUILDS_EACH,
        "max_rewards_per_month": MAX_REWARDS_PER_MONTH,
        "referred_checkouts": referred_orders,
        "converted_referrals": converted,
        "bonus_rebuilds_this_month": bonus_now,
    }
