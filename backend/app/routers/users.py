from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRequest
from app.dependencies import get_current_user
from app.utils.storage import upload_file

router = APIRouter(prefix="/api/users", tags=["users"])


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    return user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contents = await file.read()
    url = await upload_file(contents, f"avatars/{user.id}", file.filename, file.content_type or "image/png")
    if url:
        user.avatar_url = url
    return user
