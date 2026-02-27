"""add progress to builds

Revision ID: h5c3d4e6f9g0
Revises: g4b2c3d5e7f8
Create Date: 2026-02-26 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h5c3d4e6f9g0'
down_revision: Union[str, None] = 'g4b2c3d5e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('builds', sa.Column('progress', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('builds', 'progress')
