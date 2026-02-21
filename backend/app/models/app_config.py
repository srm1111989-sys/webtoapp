import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Text
from app.models.compat import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AppConfig(Base):
    __tablename__ = "app_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    package_name: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    icon_url: Mapped[str | None] = mapped_column(String(500))
    splash_url: Mapped[str | None] = mapped_column(String(500))
    primary_color: Mapped[str] = mapped_column(String(7), default="#2563EB")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#1E40AF")
    status_bar_color: Mapped[str] = mapped_column(String(7), default="#1E3A5F")
    navigation_type: Mapped[str] = mapped_column(String(20), default="none")  # none, bottom_nav, drawer
    navigation_items: Mapped[dict | None] = mapped_column(JSONB)
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    firebase_config: Mapped[dict | None] = mapped_column(JSONB)
    admob_config: Mapped[dict | None] = mapped_column(JSONB)
    desktop_config: Mapped[dict | None] = mapped_column(JSONB)
    custom_user_agent: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, active, suspended
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="apps")
    orders: Mapped[list["Order"]] = relationship(back_populates="app_config", lazy="selectin")


from app.models.user import User
from app.models.order import Order
