"""referral system: user codes, order attribution, rewards table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-07-29 01:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('referral_code', sa.String(length=20), nullable=True))
    op.create_index('ix_users_referral_code', 'users', ['referral_code'], unique=True)
    op.add_column('orders', sa.Column('referred_by_user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index('ix_orders_referred_by_user_id', 'orders', ['referred_by_user_id'])
    op.create_table(
        'referral_rewards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('referrer_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('referred_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.UniqueConstraint('referred_user_id', name='uq_referral_reward_referred_once'),
    )
    op.create_index('ix_referral_rewards_referrer_user_id', 'referral_rewards', ['referrer_user_id'])
    op.create_index('ix_referral_rewards_month', 'referral_rewards', ['month'])


def downgrade() -> None:
    op.drop_table('referral_rewards')
    op.drop_index('ix_orders_referred_by_user_id', table_name='orders')
    op.drop_column('orders', 'referred_by_user_id')
    op.drop_index('ix_users_referral_code', table_name='users')
    op.drop_column('users', 'referral_code')
