import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.team_member import TeamMember

router = APIRouter(prefix="/api/team", tags=["team"])

MAX_TEAM_MEMBERS = 10
ALLOWED_ROLES = {"viewer", "editor"}


class TeamMemberCreate(BaseModel):
    email: EmailStr
    role: str = "viewer"


class TeamMemberUpdate(BaseModel):
    role: str


class TeamMemberResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    registered: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MembershipResponse(BaseModel):
    owner_email: str
    role: str


class TeamResponse(BaseModel):
    members: list[TeamMemberResponse]
    memberships: list[MembershipResponse]


@router.get("", response_model=TeamResponse)
async def get_team(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    members_res = await db.execute(
        select(TeamMember).where(TeamMember.owner_id == user.id).order_by(TeamMember.created_at)
    )
    members = members_res.scalars().all()

    # Has each invited email actually signed up yet?
    emails = [m.email.lower() for m in members]
    registered: set[str] = set()
    if emails:
        reg_res = await db.execute(select(User.email).where(func.lower(User.email).in_(emails)))
        registered = {e.lower() for e in reg_res.scalars().all()}

    # Workspaces shared WITH me
    memberships_res = await db.execute(
        select(TeamMember, User.email)
        .join(User, User.id == TeamMember.owner_id)
        .where(func.lower(TeamMember.email) == user.email.lower())
    )
    memberships = [
        MembershipResponse(owner_email=owner_email, role=m.role)
        for m, owner_email in memberships_res.all()
    ]

    return TeamResponse(
        members=[
            TeamMemberResponse(
                id=m.id, email=m.email, role=m.role,
                registered=m.email.lower() in registered, created_at=m.created_at,
            )
            for m in members
        ],
        memberships=memberships,
    )


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    data: TeamMemberCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    email = data.email.lower().strip()
    if email == user.email.lower():
        raise HTTPException(status_code=400, detail="You already own this workspace.")
    if data.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Role must be 'viewer' or 'editor'.")

    count_res = await db.execute(
        select(func.count(TeamMember.id)).where(TeamMember.owner_id == user.id)
    )
    if (count_res.scalar() or 0) >= MAX_TEAM_MEMBERS:
        raise HTTPException(status_code=403, detail=f"Maximum {MAX_TEAM_MEMBERS} team members.")

    existing = await db.execute(
        select(TeamMember).where(
            TeamMember.owner_id == user.id, func.lower(TeamMember.email) == email
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This person is already on your team.")

    member = TeamMember(owner_id=user.id, email=email, role=data.role)
    db.add(member)
    await db.flush()
    await db.refresh(member)

    reg = await db.execute(select(func.count(User.id)).where(func.lower(User.email) == email))
    return TeamMemberResponse(
        id=member.id, email=member.email, role=member.role,
        registered=(reg.scalar() or 0) > 0, created_at=member.created_at,
    )


@router.put("/{member_id}", response_model=TeamMemberResponse)
async def update_member(
    member_id: uuid.UUID,
    data: TeamMemberUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Role must be 'viewer' or 'editor'.")
    res = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.owner_id == user.id)
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    member.role = data.role
    await db.flush()
    reg = await db.execute(
        select(func.count(User.id)).where(func.lower(User.email) == member.email.lower())
    )
    return TeamMemberResponse(
        id=member.id, email=member.email, role=member.role,
        registered=(reg.scalar() or 0) > 0, created_at=member.created_at,
    )


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.owner_id == user.id)
    )
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    await db.delete(member)
