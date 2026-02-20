import os
import uuid
import boto3
from pathlib import Path
from botocore.config import Config
from app.config import get_settings

settings = get_settings()

LOCAL_STORAGE_DIR = Path("/app/storage/artifacts")


def get_s3_client():
    if not settings.s3_endpoint:
        return None
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4"),
    )


async def upload_file(file_bytes: bytes, folder: str, filename: str, content_type: str = "application/octet-stream") -> str | None:
    client = get_s3_client()

    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    unique_name = f"{uuid.uuid4()}.{ext}"
    key = f"{folder}/{unique_name}"

    if client:
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        if settings.s3_public_url:
            return f"{settings.s3_public_url}/{key}"
        return f"{settings.s3_endpoint}/{settings.s3_bucket}/{key}"

    # Fallback: local file storage
    local_path = LOCAL_STORAGE_DIR / folder
    local_path.mkdir(parents=True, exist_ok=True)
    file_path = local_path / unique_name
    file_path.write_bytes(file_bytes)
    return f"{settings.api_url}/api/artifacts/{key}"


async def delete_file(url: str) -> bool:
    client = get_s3_client()
    if not url:
        return False

    if client:
        key = url.split(f"/{settings.s3_bucket}/")[-1]
        client.delete_object(Bucket=settings.s3_bucket, Key=key)
        return True

    # Fallback: local file deletion
    if "/api/artifacts/" in url:
        key = url.split("/api/artifacts/")[-1]
        file_path = LOCAL_STORAGE_DIR / key
        if file_path.exists():
            file_path.unlink()
            return True
    return False
