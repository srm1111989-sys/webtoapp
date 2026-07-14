import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.compat import UUID


class AppEvent(Base):
    """Telemetry from generated FREE apps only (paid apps never phone home).

    A best-effort 'app_open' ping keyed by order_id (the app) and a per-install
    device_id, so we can see which free apps are actively used and target their
    owners for upgrade.
    """
    __tablename__ = "app_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[int | None] = mapped_column(Integer, index=True)
    event: Mapped[str] = mapped_column(String(40), nullable=False, default="app_open")
    device_id: Mapped[str | None] = mapped_column(String(64), index=True)
    package: Mapped[str | None] = mapped_column(String(255))
    app_version: Mapped[str | None] = mapped_column(String(30))
    platform: Mapped[str] = mapped_column(String(16), default="android")
    ip_address: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


Index("ix_app_events_order_created", AppEvent.order_id, AppEvent.created_at)
