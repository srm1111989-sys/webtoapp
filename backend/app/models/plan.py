import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    price_inr: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # in paise
    price_usd: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # in cents
    billing_type: Mapped[str] = mapped_column(String(20), nullable=False, default="one_time")  # one_time, monthly
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    max_apps: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
