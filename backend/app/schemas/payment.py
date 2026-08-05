import uuid
from datetime import datetime
from pydantic import BaseModel


class RazorpayVerifyRequest(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class StripeCheckoutRequest(BaseModel):
    order_id: uuid.UUID


class TestPaymentRequest(BaseModel):
    order_id: uuid.UUID


class PaymentResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    gateway: str
    gateway_payment_id: str | None = None
    amount: int
    currency: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int
    currency: str
    order_id: uuid.UUID


class StripeCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PayPalCreateRequest(BaseModel):
    order_id: uuid.UUID


class PayPalCreateResponse(BaseModel):
    approval_url: str
    paypal_order_id: str
    order_id: uuid.UUID


class PayPalCaptureRequest(BaseModel):
    order_id: uuid.UUID
    paypal_order_id: str
