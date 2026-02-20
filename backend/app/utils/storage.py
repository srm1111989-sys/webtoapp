import uuid
import boto3
from botocore.config import Config
from app.config import get_settings

settings = get_settings()


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
    if not client:
        return None

    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    key = f"{folder}/{uuid.uuid4()}.{ext}"

    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )

    if settings.s3_public_url:
        return f"{settings.s3_public_url}/{key}"
    return f"{settings.s3_endpoint}/{settings.s3_bucket}/{key}"


async def delete_file(url: str) -> bool:
    client = get_s3_client()
    if not client or not url:
        return False

    key = url.split(f"/{settings.s3_bucket}/")[-1]
    client.delete_object(Bucket=settings.s3_bucket, Key=key)
    return True
