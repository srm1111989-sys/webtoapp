import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, UniqueConstraint
from app.models.compat import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class TeamMember(Base):
    """A person the account owner shares their workspace with.

    Membership is resolved by email at request time: whoever logs in with a
    matching email gets access to the owner's apps/orders. No invite email is
    sent — the owner shares the address out of band.
    """

    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("owner_id", "email", name="uq_team_owner_email"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="viewer")  # viewer | editor
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
