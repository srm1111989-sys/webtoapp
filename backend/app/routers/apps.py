import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.app_config import AppConfig
from app.schemas.app_config import AppConfigCreate, AppConfigUpdate, AppConfigResponse, AppConfigListResponse
from app.dependencies import get_current_user
from app.utils.storage import upload_file

router = APIRouter(prefix="/api/apps", tags=["apps"])


@router.post("/", response_model=AppConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_app(
    data: AppConfigCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
    result = await db.execute(
        select(AppConfig).where(AppConfig.user_id == user.id).order_by(AppConfig.created_at.desc())
    )
    apps = result.scalars().all()
    return AppConfigListResponse(apps=apps, total=len(apps))


@router.get("/{app_id}", response_model=AppConfigResponse)
async def get_app(
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
    return app_config


@router.put("/{app_id}", response_model=AppConfigResponse)
async def update_app(
    app_id: uuid.UUID,
    data: AppConfigUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppConfig).where(AppConfig.id == app_id, AppConfig.user_id == user.id)
    )
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

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
    await db.delete(app_config)


@router.post("/{app_id}/icon", response_model=AppConfigResponse)
async def upload_icon(
    app_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppConfig).where(AppConfig.id == app_id, AppConfig.user_id == user.id)
    )
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

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
    result = await db.execute(
        select(AppConfig).where(AppConfig.id == app_id, AppConfig.user_id == user.id)
    )
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    contents = await file.read()
    url = await upload_file(contents, f"splashes/{app_id}", file.filename, file.content_type or "image/png")
    if url:
        app_config.splash_url = url
    return app_config
