import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PWAConfig(Base):
    __tablename__ = "pwa_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_config_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app_configs.id"), nullable=False, index=True)
    manifest: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    service_worker_url: Mapped[str | None] = mapped_column(String(500))
    manifest_url: Mapped[str | None] = mapped_column(String(500))
    icons_urls: Mapped[dict | None] = mapped_column(JSONB)
    offline_page_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, generated, deployed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
