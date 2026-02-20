import uuid
from datetime import datetime
from pydantic import BaseModel


class BuildResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    pipeline_id: int | None = None
    status: str
    platform: str = "android"
    build_type: str
    apk_url: str | None = None
    aab_url: str | None = None
    ipa_url: str | None = None
    dsym_url: str | None = None
    source_url: str | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BuildTriggerRequest(BaseModel):
    order_id: uuid.UUID
    build_type: str = "apk"
    platform: str = "android"
