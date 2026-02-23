"""add selected_platforms to app_configs

Revision ID: e277ac5d8696
Revises:
Create Date: 2026-02-22 23:03:05.217346

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e277ac5d8696'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # subscription_payments table
    op.create_table('subscription_payments',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('subscription_id', sa.String(36), nullable=False),
        sa.Column('gateway_payment_id', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscription_payments_subscription_id'), 'subscription_payments', ['subscription_id'], unique=False)

    # selected_platforms on app_configs
    op.add_column('app_configs', sa.Column('selected_platforms', sa.JSON(), nullable=True))

    # app_config_id on subscriptions
    op.add_column('subscriptions', sa.Column('app_config_id', sa.String(36), nullable=True))
    op.create_index(op.f('ix_subscriptions_gateway_subscription_id'), 'subscriptions', ['gateway_subscription_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_subscriptions_gateway_subscription_id'), table_name='subscriptions')
    op.drop_column('subscriptions', 'app_config_id')
    op.drop_column('app_configs', 'selected_platforms')
    op.drop_index(op.f('ix_subscription_payments_subscription_id'), table_name='subscription_payments')
    op.drop_table('subscription_payments')
