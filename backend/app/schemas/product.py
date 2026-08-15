import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    sku: str
    description: str | None = None
    category: str | None = None
    price: Decimal
    cost: Decimal | None = None
    stock_qty: int = 0
    image_url: str | None = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    description: str | None = None
    category: str | None = None
    price: Decimal | None = None
    cost: Decimal | None = None
    stock_qty: int | None = None
    image_url: str | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int
    per_page: int
