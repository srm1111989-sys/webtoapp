from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.promo_code import PromoCode
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/promo", tags=["promo"])


@router.get("/{code}")
async def validate_promo_code(
    code: str,
    plan_price_usd: int = 0,  # original price in cents
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PromoCode).where(
            func.upper(PromoCode.code) == code.upper().strip(),
            PromoCode.is_active == True,
        )
    )
    promo = result.scalar_one_or_none()

    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid promo code")

    # Check expiry
    if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promo code has expired")

    # Check max uses
    if promo.max_uses > 0 and promo.current_uses >= promo.max_uses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promo code has reached maximum uses")

    # Calculate discounted price
    discount_amount = int(plan_price_usd * promo.discount_percent / 100)
    discounted_price = max(0, plan_price_usd - discount_amount)

    return {
        "valid": True,
        "code": promo.code.upper(),
        "discount_percent": promo.discount_percent,
        "original_price_usd": plan_price_usd,
        "discount_amount_usd": discount_amount,
        "discounted_price_usd": discounted_price,
        "message": f"{promo.discount_percent}% discount applied!",
    }
