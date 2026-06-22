"""add custom keystore fields

Revision ID: 9b7d8e6f5c4a
Revises: h5c3d4e6f9g0
Create Date: 2026-06-22 14:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b7d8e6f5c4a'
down_revision: Union[str, None] = 'h5c3d4e6f9g0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('app_configs', sa.Column('custom_keystore_url', sa.String(500), nullable=True))
    op.add_column('app_configs', sa.Column('custom_keystore_password', sa.String(255), nullable=True))
    op.add_column('app_configs', sa.Column('custom_keystore_alias', sa.String(255), nullable=True))
    op.add_column('app_configs', sa.Column('custom_keystore_private_password', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('app_configs', 'custom_keystore_url')
    op.drop_column('app_configs', 'custom_keystore_password')
    op.drop_column('app_configs', 'custom_keystore_alias')
    op.drop_column('app_configs', 'custom_keystore_private_password')
