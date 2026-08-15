"""add products and sales tables

Revision ID: e1f2a3b4c5d6
Revises: d4e5f6a7b8c9
Create Date: 2026-08-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'products',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('sku', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('price', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('cost', sa.Numeric(10, 2), nullable=True),
        sa.Column('stock_qty', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_products_sku', 'products', ['sku'], unique=True)
    op.create_index('ix_products_is_active', 'products', ['is_active'])
    op.create_index('ix_products_category', 'products', ['category'])
    op.create_index('ix_products_id', 'products', ['id'])

    op.create_table(
        'sales',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('order_number', sa.String(50), nullable=False),
        sa.Column('customer_name', sa.String(255), nullable=True),
        sa.Column('customer_email', sa.String(255), nullable=True),
        sa.Column('customer_phone', sa.String(20), nullable=True),
        sa.Column('items', sa.JSON(), nullable=True),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('tax_amount', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=False, server_default='cash'),
        sa.Column('payment_status', sa.String(50), nullable=False, server_default='paid'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_sales_order_number', 'sales', ['order_number'], unique=True)
    op.create_index('ix_sales_payment_status', 'sales', ['payment_status'])
    op.create_index('ix_sales_created_at', 'sales', ['created_at'])
    op.create_index('ix_sales_id', 'sales', ['id'])

    op.create_table(
        'sale_items',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('sale_id', sa.String(36), nullable=False),
        sa.Column('product_id', sa.String(36), nullable=True),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('cost_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_sale_items_sale_id', 'sale_items', ['sale_id'])
    op.create_index('ix_sale_items_product_id', 'sale_items', ['product_id'])
    op.create_index('ix_sale_items_id', 'sale_items', ['id'])


def downgrade() -> None:
    op.drop_index('ix_sale_items_product_id', table_name='sale_items')
    op.drop_index('ix_sale_items_sale_id', table_name='sale_items')
    op.drop_index('ix_sale_items_id', table_name='sale_items')
    op.drop_table('sale_items')

    op.drop_index('ix_sales_created_at', table_name='sales')
    op.drop_index('ix_sales_payment_status', table_name='sales')
    op.drop_index('ix_sales_order_number', table_name='sales')
    op.drop_index('ix_sales_id', table_name='sales')
    op.drop_table('sales')

    op.drop_index('ix_products_category', table_name='products')
    op.drop_index('ix_products_is_active', table_name='products')
    op.drop_index('ix_products_sku', table_name='products')
    op.drop_index('ix_products_id', table_name='products')
    op.drop_table('products')
