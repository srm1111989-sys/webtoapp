"""add platform to plans

Revision ID: g4b2c3d5e7f8
Revises: f3a1b2c4d5e6
Create Date: 2026-02-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g4b2c3d5e7f8'
down_revision: Union[str, None] = 'f3a1b2c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('plans', sa.Column('platform', sa.String(20), nullable=True, server_default='android'))


def downgrade() -> None:
    op.drop_column('plans', 'platform')
