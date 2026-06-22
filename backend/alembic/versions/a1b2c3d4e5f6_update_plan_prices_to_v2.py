"""update plan prices to v2

Revision ID: a1b2c3d4e5f6
Revises: 9b7d8e6f5c4a
Create Date: 2026-06-22 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9b7d8e6f5c4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE plans SET price_usd=2500, price_inr=207500 WHERE slug='android-paid'")
    op.execute("UPDATE plans SET price_usd=2500, price_inr=207500 WHERE slug='desktop-paid'")
    op.execute("UPDATE plans SET price_usd=1500, price_inr=124500 WHERE slug='play-store-listing'")
    op.execute("UPDATE plans SET price_usd=4000, price_inr=332000 WHERE slug='android-both'")


def downgrade() -> None:
    op.execute("UPDATE plans SET price_usd=1000, price_inr=83000 WHERE slug='android-paid'")
    op.execute("UPDATE plans SET price_usd=1000, price_inr=83000 WHERE slug='desktop-paid'")
    op.execute("UPDATE plans SET price_usd=1000, price_inr=83000 WHERE slug='play-store-listing'")
    op.execute("UPDATE plans SET price_usd=2000, price_inr=166000 WHERE slug='android-both'")
