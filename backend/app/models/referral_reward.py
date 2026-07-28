import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func, UniqueConstraint
from app.models.compat import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ReferralReward(Base):
    """One row per CONVERTED referral: the referred user's first paid order.

    The unique constraint on referred_user_id enforces "one reward per referred
    customer" at the database level — a user paying twice never double-rewards.
    Rewards are consumed by the rebuild-quota logic (+5 rebuilds per reward in
    the month it was earned, capped at 10 rewards/referrer/month at grant time).
    """

    __tablename__ = "referral_rewards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referrer_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    referred_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # e.g. "2026-07"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("referred_user_id", name="uq_referral_reward_referred_once"),
    )
