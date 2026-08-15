import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.admin import Admin
from app.models.project import Project, ProjectMember
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectMemberCreate, ProjectMemberUpdate, ProjectMemberResponse, ProjectMemberWithAdmin,
    ProjectStats, MyProjectsResponse,
)
from app.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin/projects", tags=["admin-projects"])


def _is_super(admin: Admin) -> bool:
    return admin.is_super


async def _visible_project_ids(admin: Admin, db: AsyncSession) -> list[uuid.UUID] | None:
    """Return list of project IDs this admin can see, or None for all (is_super)."""
    if _is_super(admin):
        return None
    result = await db.execute(
        select(ProjectMember.project_id)
        .where(
            ProjectMember.admin_id == admin.id,
            ProjectMember.role.in_(["master_admin", "admin", "member"]),
        )
    )
    ids = [r[0] for r in result.all()]
    if not ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="No project access")
    return ids


async def _require_project_admin(admin: Admin, project_id: uuid.UUID, db: AsyncSession, min_role: str = "member") -> ProjectMember:
    """Check that admin has at least min_role access to the project."""
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id, ProjectMember.admin_id == admin.id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not a member of this project")
    role_rank = {"master_admin": 3, "admin": 2, "member": 1}
    if role_rank.get(member.role, 0) < role_rank.get(min_role, 0):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Insufficient project role")
    return member


# --- Projects CRUD ---

@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    query = select(Project)
    if visible is not None:
        query = query.where(Project.id.in_(visible))

    count_query = select(func.count()).select_from(Project.subquery())
    if visible is not None:
        count_query = count_query.where(Project.id.in_(visible))

    total = (await db.execute(count_query)).scalar()
    result = await db.execute(query.order_by(Project.name))
    projects = result.scalars().all()

    # Attach member counts
    for p in projects:
        mc = (await db.execute(
            select(func.count()).select_from(ProjectMember).where(ProjectMember.project_id == p.id)
        )).scalar()
        p.member_count = mc  # type: ignore[attr-defined]

    return ProjectListResponse(items=projects, total=total)


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if not _is_super(admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only master admin can create projects")

    existing = await db.execute(select(Project).where(Project.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Project slug already exists")

    project = Project(**data.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    if visible is not None and project_id not in visible:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")

    mc = (await db.execute(
        select(func.count()).select_from(ProjectMember).where(ProjectMember.project_id == project_id)
    )).scalar()
    project.member_count = mc  # type: ignore[attr-defined]
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    if visible is not None and project_id not in visible:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.color is not None:
        project.color = data.color
    if data.is_active is not None:
        project.is_active = data.is_active

    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if not _is_super(admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only master admin can delete projects")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.delete(project)
    await db.flush()


# --- Project Members ---

@router.get("/{project_id}/members", response_model=list[ProjectMemberWithAdmin])
async def list_members(
    project_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    if visible is not None and project_id not in visible:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Join ProjectMember with Admin via raw SQL for the join
    result = await db.execute(
        select(
            ProjectMember.id,
            ProjectMember.project_id,
            ProjectMember.admin_id,
            ProjectMember.role,
            ProjectMember.created_at,
            Admin.email.label("admin_email"),
            Admin.full_name.label("admin_name"),
        )
        .join(Admin, Admin.id == ProjectMember.admin_id)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.role, Admin.full_name)
    )
    rows = result.all()
    return [
        ProjectMemberWithAdmin(
            id=row.id,
            project_id=row.project_id,
            admin_id=row.admin_id,
            role=row.role,
            created_at=row.created_at,
            admin_email=row.admin_email,
            admin_name=row.admin_name,
        )
        for row in rows
    ]


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: uuid.UUID,
    data: ProjectMemberCreate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    if visible is not None and project_id not in visible:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Only master_admin or super can add members
    caller = await _require_project_admin(admin, project_id, db, min_role="admin")

    target_admin = await db.get(Admin, data.admin_id)
    if not target_admin:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Admin not found")

    # Cannot assign master_admin unless caller is super
    if data.role == "master_admin" and not _is_super(admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only super admin can assign master_admin")

    # Prevent duplicate
    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.admin_id == data.admin_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Admin already a member")

    member = ProjectMember(project_id=project_id, admin_id=data.admin_id, role=data.role)
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.put("/{project_id}/members/{member_id}", response_model=ProjectMemberResponse)
async def update_member(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    data: ProjectMemberUpdate,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    if visible is not None and project_id not in visible:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")

    member = await db.get(ProjectMember, member_id)
    if not member or member.project_id != project_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Member not found")

    caller = await _require_project_admin(admin, project_id, db, min_role="admin")

    if data.role == "master_admin" and not _is_super(admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only super admin can assign master_admin")

    member.role = data.role
    await db.flush()
    await db.refresh(member)
    return member


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    visible = await _visible_project_ids(admin, db)
    if visible is not None and project_id not in visible:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")

    member = await db.get(ProjectMember, member_id)
    if not member or member.project_id != project_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Member not found")

    await _require_project_admin(admin, project_id, db, min_role="admin")

    await db.delete(member)
    await db.flush()


@router.get("/available-admins", response_model=list[dict])
async def list_available_admins(
    project_id: str | None = None,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List admins not yet in this project, for the add-member dropdown."""
    if not _is_super(admin):
        if project_id:
            try:
                await _require_project_admin(admin, uuid.UUID(project_id), db, min_role="admin")
            except HTTPException:
                raise
        else:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only admin can list admins")

    pid = uuid.UUID(project_id) if project_id else None
    query = select(Admin.id, Admin.email, Admin.full_name).order_by(Admin.full_name)

    if pid:
        # Exclude admins already members of this project
        existing_subq = select(ProjectMember.admin_id).where(ProjectMember.project_id == pid)
        query = query.where(~Admin.id.in_(existing_subq))

    result = await db.execute(query)
    return [{"id": str(r.id), "email": r.email, "full_name": r.full_name} for r in result.all()]


@router.get("/me/assigned", response_model=MyProjectsResponse)
async def my_projects(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if _is_super(admin):
        # Super sees all projects
        result = await db.execute(select(Project).order_by(Project.name))
        all_projects = result.scalars().all()
        return MyProjectsResponse(projects=all_projects, is_super=True)

    result = await db.execute(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.admin_id == admin.id)
        .order_by(Project.name)
    )
    projects = result.scalars().all()
    return MyProjectsResponse(projects=projects, is_super=False)
