import uuid
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from app.database import get_db
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
)
from app.schemas.sale import (
    SaleCreate, SaleUpdate, SaleResponse, SaleListResponse,
)
from app.dependencies import get_current_admin, get_current_user, team_access

router = APIRouter(prefix="/api/admin/sales", tags=["sales"])


# ─── Product endpoints ───────────────────────────────────────────────────────


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    is_active: bool | None = None,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all products with optional filters."""
    conditions = []
    if search:
        ilike = f"%{search}%"
        conditions.append(or_(Product.name.ilike(ilike), Product.sku.ilike(ilike), Product.description.ilike(ilike)))
    if category:
        conditions.append(Product.category == category)
    if is_active is not None:
        conditions.append(Product.is_active == is_active)

    query = select(Product)
    if conditions:
        query = query.where(and_(*conditions))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    result = await db.execute(
        query.order_by(Product.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    products = result.scalars().all()

    return ProductListResponse(products=products, total=total, page=page, per_page=per_page)


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new product."""
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    product.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a product (set is_active=False)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    product.updated_at = datetime.now(timezone.utc)
    await db.flush()


# ─── Sale endpoints ──────────────────────────────────────────────────────────


@router.get("/sales", response_model=SaleListResponse)
async def list_sales(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    start_date: str | None = None,
    end_date: str | None = None,
    payment_method: str | None = None,
    payment_status: str | None = None,
    search: str | None = None,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all sales with optional date/method/status filters."""
    conditions = []

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
            conditions.append(Sale.created_at >= start_dt)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid start_date format (use YYYY-MM-DD)")

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            conditions.append(Sale.created_at <= end_dt)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid end_date format (use YYYY-MM-DD)")

    if payment_method:
        conditions.append(Sale.payment_method == payment_method)
    if payment_status:
        conditions.append(Sale.payment_status == payment_status)

    if search:
        ilike = f"%{search}%"
        conditions.append(
            or_(
                Sale.customer_name.ilike(ilike),
                Sale.customer_email.ilike(ilike),
                Sale.order_number.ilike(ilike),
            )
        )

    query = select(Sale)
    if conditions:
        query = query.where(and_(*conditions))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    result = await db.execute(
        query.order_by(Sale.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    sales = result.scalars().all()

    return SaleListResponse(sales=sales, total=total, page=page, per_page=per_page)


@router.post("/sales", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    data: SaleCreate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new sale with items. Auto-generates order_number if not provided."""
    order_number = data.order_number or f"SALE-{uuid.uuid4().hex[:8].upper()}"

    # Compute totals from items
    items_data = [item.model_dump() for item in (data.items or [])]
    subtotal = sum(item["unit_price"] * item["quantity"] for item in items_data)

    sale = Sale(
        order_number=order_number,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        customer_phone=data.customer_phone,
        items=items_data,
        subtotal=subtotal,
        tax_amount=data.tax_amount or Decimal("0.00"),
        discount_amount=data.discount_amount or Decimal("0.00"),
        total_amount=data.total_amount,
        payment_method=data.payment_method,
        payment_status=data.payment_status,
        notes=data.notes,
    )
    db.add(sale)
    await db.flush()
    await db.refresh(sale)

    # Create SaleItem rows and adjust stock
    for item_data in items_data:
        product_name = item_data["product_name"]
        cost_price = item_data.get("cost_price")
        product_id = item_data.get("product_id")

        # Look up stock cost if not provided
        if cost_price is None and product_id:
            prod_result = await db.execute(select(Product).where(Product.id == product_id))
            prod = prod_result.scalar_one_or_none()
            if prod:
                cost_price = prod.cost

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product_id,
            product_name=product_name,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            cost_price=cost_price,
            subtotal=item_data["unit_price"] * item_data["quantity"],
        )
        db.add(sale_item)

        # Adjust stock
        if product_id:
            prod_result = await db.execute(select(Product).where(Product.id == product_id))
            prod = prod_result.scalar_one_or_none()
            if prod:
                prod.stock_qty = max(0, prod.stock_qty - item_data["quantity"])

    await db.flush()
    await db.refresh(sale)
    return sale


@router.get("/sales/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single sale with its items."""
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    items_result = await db.execute(
        select(SaleItem).where(SaleItem.sale_id == sale_id).order_by(SaleItem.created_at)
    )
    sale.sale_items = items_result.scalars().all()
    return sale


@router.put("/sales/{sale_id}", response_model=SaleResponse)
async def update_sale(
    sale_id: uuid.UUID,
    data: SaleUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update sale metadata (customer info, payment status, notes)."""
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sale, key, value)

    sale.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(sale)

    items_result = await db.execute(
        select(SaleItem).where(SaleItem.sale_id == sale_id).order_by(SaleItem.created_at)
    )
    sale.sale_items = items_result.scalars().all()
    return sale


@router.delete("/sales/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_sale(
    sale_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a sale and restore stock."""
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    sale.payment_status = "cancelled"
    sale.updated_at = datetime.now(timezone.utc)

    # Restore stock
    items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale_id))
    for item in items_result.scalars().all():
        if item.product_id:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            prod = prod_result.scalar_one_or_none()
            if prod:
                prod.stock_qty += item.quantity

    await db.flush()


# ─── Analytics endpoints ─────────────────────────────────────────────────────


@router.get("/analytics/summary")
async def sales_summary(
    start_date: str | None = None,
    end_date: str | None = None,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Sales summary for the given date range (default: current month)."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    conditions = [Sale.payment_status == "paid"]
    start_dt = month_start
    end_dt = now

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid start_date")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid end_date")

    conditions.append(Sale.created_at >= start_dt)
    conditions.append(Sale.created_at <= end_dt)

    # Total revenue, count, avg order
    agg_query = select(
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), Decimal("0")),
        func.coalesce(func.avg(Sale.total_amount), Decimal("0")),
    ).where(and_(*conditions))
    agg = (await db.execute(agg_query)).one()
    total_sales = agg[0] or 0
    total_revenue = agg[1] or Decimal("0")
    avg_order_value = agg[2] or Decimal("0")

    # Payment method breakdown
    pm_query = select(
        Sale.payment_method,
        func.count(Sale.id).label("count"),
        func.coalesce(func.sum(Sale.total_amount), Decimal("0")).label("total"),
    ).where(and_(*conditions)).group_by(Sale.payment_method)
    pm_rows = (await db.execute(pm_query)).all()
    by_method = {row[0]: {"count": row[1], "total": float(row[2])} for row in pm_rows}

    # Daily sales series
    daily_query = select(
        func.date(Sale.created_at).label("date"),
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), Decimal("0")),
    ).where(and_(*conditions)).group_by(func.date(Sale.created_at)).order_by("date")
    daily_rows = (await db.execute(daily_query)).all()
    daily = [
        {"date": str(row[0]), "count": row[1], "total": float(row[2])}
        for row in daily_rows
    ]

    # Top products
    from sqlalchemy import text as sql_text
    top_products_query = select(
        SaleItem.product_name,
        func.sum(SaleItem.quantity).label("total_qty"),
        func.sum(SaleItem.subtotal).label("total_revenue"),
    ).join(Sale, SaleItem.sale_id == Sale.id).where(
        and_(Sale.payment_status == "paid", Sale.created_at >= start_dt, Sale.created_at <= end_dt)
    ).group_by(SaleItem.product_name).order_by(func.sum(SaleItem.subtotal).desc()).limit(10)
    top_rows = (await db.execute(top_products_query)).all()
    top_products = [
        {"name": row[0], "qty_sold": row[1], "revenue": float(row[2])}
        for row in top_rows
    ]

    return {
        "period": {"start": start_dt.isoformat(), "end": end_dt.isoformat()},
        "total_sales": total_sales,
        "total_revenue": float(total_revenue),
        "avg_order_value": float(avg_order_value),
        "by_payment_method": by_method,
        "daily": daily,
        "top_products": top_products,
    }
