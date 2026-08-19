import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from app.models.compat import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    app_config_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app_configs.id"), nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # in smallest unit (paise/cents)
    rebuild_limit: Mapped[int | None] = mapped_column(Integer)  # per-order override for monthly rebuild cap (defaults to 5)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, paid, failed, refunded
    payment_gateway: Mapped[str | None] = mapped_column(String(20))  # razorpay, stripe, test
    gateway_order_id: Mapped[str | None] = mapped_column(String(255))
    gateway_payment_id: Mapped[str | None] = mapped_column(String(255))
    order_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB)
    # Set when a referral code was applied at checkout — the referring user
    # earns bonus rebuilds when this order is paid (first paid order only).
    referred_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="orders", lazy="selectin")
    app_config: Mapped["AppConfig"] = relationship(back_populates="orders", lazy="selectin")
    plan: Mapped["Plan"] = relationship(lazy="selectin")
    payment: Mapped["Payment | None"] = relationship(back_populates="order", uselist=False, lazy="selectin")
    builds: Mapped[list["Build"]] = relationship(back_populates="order", lazy="selectin")


from app.models.user import User
from app.models.app_config import AppConfig
from app.models.plan import Plan
from app.models.payment import Payment
from app.models.build import Build
