import uuid
from datetime import datetime
from pydantic import BaseModel


class OrderCreate(BaseModel):
    app_config_id: uuid.UUID
    plan_id: uuid.UUID
    currency: str = "USD"
    payment_gateway: str = "razorpay"  # razorpay, stripe, test
    promo_code: str | None = None


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
    plan_name: str | None = None
    app_name: str | None = None
    selected_platforms: list[str] | None = None
    app_url: str | None = None
    plan_state: str | None = None  # free_unbuilt | free_trial | free_expired | paid | pending_payment
    trial_days_left: int | None = None
    rebuilds_left_this_month: int | None = None
    build_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderDetailResponse(OrderResponse):
    builds: list["BuildResponse"] = []


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    per_page: int


from app.schemas.build import BuildResponse
