"""Referral program (t121, 2026-07-29).

Mechanic: every user has a personal code (REF-XXXXXX). A NEW customer enters it
at checkout for 10% off a paid plan. When that referred order is PAID, the
referrer earns +5 bonus rebuilds for the calendar month (consumed by the quota
logic in routers/builds.py). Guards: no self-referral, reward only for the
referred user's FIRST paid order (DB unique constraint), max 10 rewards per
referrer per month.
"""
import secrets
import string
from datetime import datetime, timezone

from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.referral_reward import ReferralReward

REFERRAL_DISCOUNT_PERCENT = 10
REWARD_REBUILDS_EACH = 5
MAX_REWARDS_PER_MONTH = 10

_CODE_ALPHABET = string.ascii_uppercase + string.digits


def _month_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


async def ensure_referral_code(db: AsyncSession, user: User) -> str:
    """Return the user's referral code, generating one on first use."""
    if user.referral_code:
        return user.referral_code
    for _ in range(20):
        code = "REF-" + "".join(secrets.choice(_CODE_ALPHABET) for _ in range(6))
        clash = await db.execute(select(User.id).where(User.referral_code == code))
        if not clash.scalar_one_or_none():
            user.referral_code = code
            await db.commit()
            return code
    raise RuntimeError("could not generate a unique referral code")


async def find_referrer_by_code(db: AsyncSession, code: str) -> User | None:
    code = (code or "").strip().upper()
    if not code.startswith("REF-"):
        return None
    result = await db.execute(select(User).where(User.referral_code == code))
    return result.scalar_one_or_none()


async def bonus_rebuilds_for_month(db: AsyncSession, user_id, month: str | None = None) -> int:
    """Extra rebuild allowance earned from converted referrals this month."""
    month = month or _month_now()
    count = (await db.execute(
        select(sqlfunc.count(ReferralReward.id)).where(
            ReferralReward.referrer_user_id == user_id,
            ReferralReward.month == month,
        )
    )).scalar() or 0
    return count * REWARD_REBUILDS_EACH


async def grant_reward_for_paid_order(db: AsyncSession, order) -> bool:
    """Called after an order flips to paid. Best-effort: never raises into the
    payment path — a reward bug must not break a captured payment."""
    try:
        referrer_id = getattr(order, "referred_by_user_id", None)
        if not referrer_id or referrer_id == order.user_id:
            return False
        # First paid order per referred user (also enforced by the DB unique).
        existing = (await db.execute(
            select(ReferralReward.id).where(ReferralReward.referred_user_id == order.user_id)
        )).scalar_one_or_none()
        if existing:
            return False
        month = _month_now()
        month_count = (await db.execute(
            select(sqlfunc.count(ReferralReward.id)).where(
                ReferralReward.referrer_user_id == referrer_id,
                ReferralReward.month == month,
            )
        )).scalar() or 0
        if month_count >= MAX_REWARDS_PER_MONTH:
            return False
        db.add(ReferralReward(
            referrer_user_id=referrer_id,
            referred_user_id=order.user_id,
            order_id=order.id,
            month=month,
        ))
        await db.commit()
        return True
    except Exception as e:  # noqa: BLE001
        import logging
        logging.getLogger("referrals").error("reward grant failed for order %s: %s", getattr(order, "id", "?"), e)
        try:
            await db.rollback()
        except Exception:
            pass
        return False
