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
    ipa_url: str | None = None
    source_url: str | None = None
    keystore_url: str | None = None
    keystore_password: str | None = None
    keystore_alias: str | None = None
    error_message: str | None = None
    variables: dict | None = None
    pipeline_url: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def compute_pipeline_url(self):
        if not self.pipeline_id:
            self.pipeline_url = None
            return self
        
        provider = (self.variables or {}).get("_build_provider")
        repo = "srm1111989-sys/webtoapp"
        if provider in ("github", "github1"):
            repo = "pallavimokashi94-sys/webtoapp"
        elif provider == "github2":
            repo = "mokashiswapnil/webtoapp"
        elif provider == "github3":
            repo = "sohamsmulay/webtoapp"
        elif provider == "github4":
            repo = "srm1111989-sys/webtoapp"
            
        self.pipeline_url = f"https://github.com/{repo}/actions/runs/{self.pipeline_id}"
        return self


class BuildTriggerRequest(BaseModel):
    order_id: uuid.UUID
    build_type: str = "apk"
