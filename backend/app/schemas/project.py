import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=50, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    color: str = "#6366f1"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    is_active: bool | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str | None = None
    color: str
    is_active: bool
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int


class ProjectMemberCreate(BaseModel):
    admin_id: uuid.UUID
    role: str = "member"  # master_admin | admin | member


class ProjectMemberUpdate(BaseModel):
    role: str  # master_admin | admin | member


class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    admin_id: uuid.UUID
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectMemberWithAdmin(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    admin_id: uuid.UUID
    role: str
    created_at: datetime
    admin_email: str
    admin_name: str

    model_config = {"from_attributes": True}


class ProjectStats(BaseModel):
    project_id: uuid.UUID
    member_count: int
    master_admin_count: int
    admin_count: int
    member_role_count: int


class MyProjectsResponse(BaseModel):
    projects: list[ProjectResponse]
    is_super: bool