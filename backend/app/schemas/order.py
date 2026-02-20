import uuid
from datetime import datetime
from pydantic import BaseModel


class OrderCreate(BaseModel):
    app_config_id: uuid.UUID
    plan_id: uuid.UUID
    currency: str = "INR"
    payment_gateway: str = "razorpay"  # razorpay, stripe, test


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    app_config_id: uuid.UUID
    plan_id: uuid.UUID
    order_number: str
    amount: int
    currency: str
    status: str
    payment_gateway: str | None = None
    gateway_order_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderDetailResponse(OrderResponse):
    builds: list["BuildResponse"] = []
    plan_name: str | None = None
    app_name: str | None = None


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    per_page: int


from app.schemas.build import BuildResponse
