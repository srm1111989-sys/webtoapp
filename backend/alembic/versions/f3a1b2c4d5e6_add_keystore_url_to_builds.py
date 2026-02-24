"""add keystore_url to builds

Revision ID: f3a1b2c4d5e6
Revises: e277ac5d8696
Create Date: 2026-02-24 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, None] = 'e277ac5d8696'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('builds', sa.Column('keystore_url', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('builds', 'keystore_url')
