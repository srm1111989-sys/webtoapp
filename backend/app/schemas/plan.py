import uuid
from datetime import datetime
from pydantic import BaseModel


class PlanResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    price_inr: int
    price_usd: int
    billing_type: str
    features: dict
    max_apps: int
    is_active: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PlanCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    price_inr: int = 0
    price_usd: int = 0
    billing_type: str = "one_time"
    features: dict = {}
    max_apps: int = 1
    sort_order: int = 0


class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_inr: int | None = None
    price_usd: int | None = None
    features: dict | None = None
    max_apps: int | None = None
    is_active: bool | None = None
    sort_order: int | None = None
