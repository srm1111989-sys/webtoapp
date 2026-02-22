import uuid
from datetime import datetime
from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    plan_id: uuid.UUID
    currency: str = "INR"  # INR or USD
    app_config_id: uuid.UUID


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    plan_id: uuid.UUID
    gateway: str
    gateway_subscription_id: str | None = None
    status: str
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancelled_at: datetime | None = None
    plan_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionDetailResponse(SubscriptionResponse):
    payments: list["SubscriptionPaymentResponse"] = []


class SubscriptionPaymentResponse(BaseModel):
    id: uuid.UUID
    gateway_payment_id: str | None = None
    amount: int
    currency: str
    status: str
    paid_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
