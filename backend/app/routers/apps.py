import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.database import get_db
from app.models.user import User
from app.models.app_config import AppConfig
from app.models.order import Order
from app.schemas.app_config import AppConfigCreate, AppConfigUpdate, AppConfigResponse, AppConfigListResponse
from app.dependencies import get_current_user, team_access
from app.utils.storage import upload_file


async def get_accessible_app(app_id, user, db, *, write: bool = False) -> AppConfig:
    """Fetch an app the user owns or that is shared with them via team access.

    write=True requires owner or editor role; viewers are read-only.
    """
    access = await team_access(user, db)
    result = await db.execute(
        select(AppConfig).where(AppConfig.id == app_id, AppConfig.user_id.in_(list(access.keys())))
    )
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")
    if write and access.get(app_config.user_id) == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers can't modify this app")
    return app_config

router = APIRouter(prefix="/api/apps", tags=["apps"])


@router.post("/", response_model=AppConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_app(
    data: AppConfigCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check app limit for free users (max 5 apps)
    has_paid_order = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == user.id, Order.amount > 0, Order.status == "paid")
    )
    paid_count = has_paid_order.scalar() or 0

    if paid_count == 0:
        app_count_result = await db.execute(
            select(func.count(AppConfig.id)).where(
                AppConfig.user_id == user.id, AppConfig.status != "deleted"
            )
        )
        app_count = app_count_result.scalar() or 0
        if app_count >= 5:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free plan allows maximum 5 apps. Upgrade to a paid plan to create more apps.",
            )

    app_config = AppConfig(user_id=user.id, **data.model_dump())
    db.add(app_config)
    await db.flush()
    await db.refresh(app_config)
    return app_config


@router.get("/", response_model=AppConfigListResponse)
async def list_apps(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Auto-delete abandoned wizard sessions (draft, no order, older than 24h)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    await db.execute(
        delete(AppConfig).where(
            AppConfig.user_id == user.id,
            AppConfig.status == "draft",
            AppConfig.created_at < cutoff,
            ~AppConfig.id.in_(select(Order.app_config_id).where(Order.user_id == user.id)),
        )
    )
    await db.commit()

    # Own apps + apps from workspaces shared with this user (team access).
    # Drafts (in-progress wizard) and deleted apps stay hidden.
    access = await team_access(user, db)
    result = await db.execute(
        select(AppConfig)
        .where(AppConfig.user_id.in_(list(access.keys())), AppConfig.status.notin_(["draft", "deleted"]))
        .order_by(AppConfig.created_at.desc())
    )
    apps = []
    for a in result.scalars().all():
        resp = AppConfigResponse.model_validate(a)
        if a.user_id != user.id:
            resp.is_shared = True
            resp.access_role = access.get(a.user_id, "viewer")
        apps.append(resp)
    return AppConfigListResponse(apps=apps, total=len(apps))


@router.get("/{app_id}", response_model=AppConfigResponse)
async def get_app(
    app_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_accessible_app(app_id, user, db)


@router.put("/{app_id}", response_model=AppConfigResponse)
async def update_app(
    app_id: uuid.UUID,
    data: AppConfigUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app_config = await get_accessible_app(app_id, user, db, write=True)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app_config, key, value)

    await db.flush()
    await db.refresh(app_config)
    return app_config


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_app(
    app_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppConfig).where(AppConfig.id == app_id, AppConfig.user_id == user.id)
    )
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    # Apps that were ordered are soft-deleted: orders/builds must survive so the
    # lifetime free-build quota and payment history can't be reset by deleting.
    has_orders = await db.execute(
        select(func.count(Order.id)).where(Order.app_config_id == app_config.id)
    )
    if (has_orders.scalar() or 0) > 0:
        app_config.status = "deleted"
        await db.flush()
    else:
        await db.delete(app_config)


@router.post("/{app_id}/icon", response_model=AppConfigResponse)
async def upload_icon(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app_config = await get_accessible_app(app_id, user, db, write=True)

    contents = await file.read()
    url = await upload_file(contents, f"icons/{app_id}", file.filename, file.content_type or "image/png")
    if url:
        app_config.icon_url = url
    return app_config


@router.post("/{app_id}/splash", response_model=AppConfigResponse)
async def upload_splash(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app_config = await get_accessible_app(app_id, user, db, write=True)

    contents = await file.read()
    url = await upload_file(contents, f"splashes/{app_id}", file.filename, file.content_type or "image/png")
    if url:
        app_config.splash_url = url
    return app_config


@router.post("/{app_id}/keystore", response_model=AppConfigResponse)
async def upload_keystore(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app_config = await get_accessible_app(app_id, user, db, write=True)

    contents = await file.read()
    url = await upload_file(contents, f"keystores/{app_id}", file.filename, file.content_type or "application/octet-stream")
    if url:
        app_config.custom_keystore_url = url
    return app_config

