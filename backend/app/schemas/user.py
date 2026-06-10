import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, model_validator


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    app_url: str | None = None
    app_status: str | None = None
    pipeline_id: int | None = None
    pipeline_url: str | None = None
    apk_url: str | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode='before')
    @classmethod
    def extract_app_fields(cls, v):
        if hasattr(v, 'apps') and v.apps:
            first = v.apps[0]
            v.__dict__.setdefault('app_url', first.url)
            v.__dict__.setdefault('app_status', first.status)
        return v


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    per_page: int
