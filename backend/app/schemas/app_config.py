import re
import uuid
from datetime import datetime
from typing import Any
from urllib.parse import urlparse
from pydantic import BaseModel, Field, HttpUrl, field_validator


HEX_COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
PACKAGE_NAME_RE = re.compile(r'^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$')


class AppConfigCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    url: str = Field(max_length=500)
    package_name: str | None = None
    description: str | None = None
    primary_color: str = "#2563EB"
    secondary_color: str = "#1E40AF"
    status_bar_color: str = "#1E3A5F"

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('App name cannot be empty')
        if len(v) > 255:
            raise ValueError('App name must be 255 characters or less')
        return v

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Website URL is required')
        parsed = urlparse(v)
        if parsed.scheme not in ('http', 'https'):
            if not v.startswith(('http://', 'https://')):
                v = 'https://' + v
                parsed = urlparse(v)
        if not parsed.netloc or '.' not in parsed.netloc:
            raise ValueError('Please enter a valid website URL (e.g., https://example.com)')
        return v

    @field_validator('package_name')
    @classmethod
    def validate_package_name(cls, v: str | None) -> str | None:
        if v is None or v.strip() == '':
            return None
        v = v.strip().lower()
        if not PACKAGE_NAME_RE.match(v):
            raise ValueError(
                'Invalid package name. Must be like "com.example.app" — '
                'each segment must start with a letter and contain only letters, digits, or underscores.'
            )
        return v

    @field_validator('primary_color', 'secondary_color', 'status_bar_color')
    @classmethod
    def validate_color(cls, v: str) -> str:
        if not HEX_COLOR_RE.match(v):
            raise ValueError(f'Invalid color "{v}". Must be a hex color like #2563EB')
        return v
    navigation_type: str = "none"
    navigation_items: Any = None
    features: dict = {}
    firebase_config: dict | None = None
    admob_config: dict | None = None
    selected_platforms: list[str] | None = None
    desktop_config: dict | None = None
    custom_user_agent: str | None = None
    version_code: int | None = None
    custom_keystore_url: str | None = None
    custom_keystore_password: str | None = None
    custom_keystore_alias: str | None = None
    custom_keystore_private_password: str | None = None


class AppConfigUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    package_name: str | None = None
    description: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    status_bar_color: str | None = None
    navigation_type: str | None = None
    navigation_items: Any = None
    features: dict | None = None
    firebase_config: dict | None = None
    admob_config: dict | None = None
    selected_platforms: list[str] | None = None
    desktop_config: dict | None = None
    custom_user_agent: str | None = None
    version_code: int | None = None
    custom_keystore_url: str | None = None
    custom_keystore_password: str | None = None
    custom_keystore_alias: str | None = None
    custom_keystore_private_password: str | None = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError('App name cannot be empty')
        return v

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        parsed = urlparse(v)
        if parsed.scheme not in ('http', 'https'):
            if not v.startswith(('http://', 'https://')):
                v = 'https://' + v
                parsed = urlparse(v)
        if not parsed.netloc or '.' not in parsed.netloc:
            raise ValueError('Please enter a valid website URL')
        return v

    @field_validator('package_name')
    @classmethod
    def validate_package_name(cls, v: str | None) -> str | None:
        if v is None or v.strip() == '':
            return None
        v = v.strip().lower()
        if not PACKAGE_NAME_RE.match(v):
            raise ValueError('Invalid package name format')
        return v

    @field_validator('primary_color', 'secondary_color', 'status_bar_color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not HEX_COLOR_RE.match(v):
            raise ValueError(f'Invalid color "{v}". Must be hex like #2563EB')
        return v


class AppConfigResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    url: str
    package_name: str | None = None
    description: str | None = None
    icon_url: str | None = None
    splash_url: str | None = None
    notification_icon_url: str | None = None
    primary_color: str
    secondary_color: str
    status_bar_color: str
    navigation_type: str
    navigation_items: Any = None
    features: dict
    firebase_config: dict | None = None
    admob_config: dict | None = None
    selected_platforms: list[str] | None = None
    desktop_config: dict | None = None
    custom_user_agent: str | None = None
    version_code: int | None = None
    custom_keystore_url: str | None = None
    custom_keystore_password: str | None = None
    custom_keystore_alias: str | None = None
    custom_keystore_private_password: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    # Team sharing: set when this app belongs to a workspace shared with the caller
    is_shared: bool = False
    access_role: str = "owner"  # owner | editor | viewer

    model_config = {"from_attributes": True}


class AppConfigListResponse(BaseModel):
    apps: list[AppConfigResponse]
    total: int
