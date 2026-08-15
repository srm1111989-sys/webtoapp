import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class SaleItemCreate(BaseModel):
    product_id: uuid.UUID | None = None
    product_name: str
    quantity: int = 1
    unit_price: Decimal
    cost_price: Decimal | None = None


class SaleItemResponse(SaleItemCreate):
    id: uuid.UUID
    sale_id: uuid.UUID
    subtotal: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class SaleBase(BaseModel):
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    items: list[SaleItemCreate] | None = None
    subtotal: Decimal
    tax_amount: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")
    total_amount: Decimal
    payment_method: str = "cash"
    payment_status: str = "paid"
    notes: str | None = None


class SaleCreate(SaleBase):
    order_number: str | None = None


class SaleUpdate(BaseModel):
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    payment_method: str | None = None
    payment_status: str | None = None
    notes: str | None = None


class SaleResponse(SaleBase):
    id: uuid.UUID
    order_number: str
    items: list | None = None
    created_at: datetime
    updated_at: datetime
    sale_items: list[SaleItemResponse] = []

    model_config = {"from_attributes": True}


class SaleListResponse(BaseModel):
    sales: list[SaleResponse]
    total: int
    page: int
    per_page: int
