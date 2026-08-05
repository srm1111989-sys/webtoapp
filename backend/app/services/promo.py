"""Promo consumption at PAYMENT time.

Promo codes used to be consumed (current_uses += 1) when the ORDER was
created, so a failed or abandoned payment burned the code anyway — a
single-use code died on a declined card (Lovasecond report, 2026-08-05).
The applied code now rides in order.order_metadata and is consumed here,
called from every payment-success path (Razorpay verify, Stripe webhook,
PayPal capture, test payment, and zero-amount promo orders).
"""
import logging

from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.promo_code import PromoCode

logger = logging.getLogger(__name__)


async def consume_promo_for_paid_order(db: AsyncSession, order: Order) -> None:
    """Record the promo use for a now-paid order. Best-effort and idempotent:
    the metadata flag flips so a webhook retry can't double-count, and any
    failure is logged, never raised into the payment path."""
    try:
        meta = order.order_metadata or {}
        code = meta.get("promo_code")
        if not code or meta.get("promo_consumed"):
            return
        result = await db.execute(
            select(PromoCode).where(sqlfunc.upper(PromoCode.code) == code.upper())
        )
        promo = result.scalar_one_or_none()
        if promo:
            promo.current_uses += 1
        # Flag consumption even if the code row vanished — the intent is
        # "this order's use is accounted for".
        order.order_metadata = {**meta, "promo_consumed": True}
    except Exception as e:
        logger.error(f"promo consumption failed for order {order.id}: {e}")
