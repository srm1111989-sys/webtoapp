import uuid
from datetime import datetime
from pydantic import BaseModel, model_validator


class BuildResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    pipeline_id: int | None = None
    status: str
    platform: str = "android"
    build_type: str
    progress: int = 0
    apk_url: str | None = None
    aab_url: str | None = None
    exe_url: str | None = None
    source_url: str | None = None
    keystore_url: str | None = None
    keystore_password: str | None = None
    keystore_alias: str | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BuildTriggerRequest(BaseModel):
    order_id: uuid.UUID
    build_type: str = "apk"
