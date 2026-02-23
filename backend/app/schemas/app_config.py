import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, HttpUrl


class AppConfigCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    url: str = Field(max_length=500)
    package_name: str | None = None
    description: str | None = None
    primary_color: str = "#2563EB"
    secondary_color: str = "#1E40AF"
    status_bar_color: str = "#1E3A5F"
    navigation_type: str = "none"
    navigation_items: Any = None
    features: dict = {}
    firebase_config: dict | None = None
    admob_config: dict | None = None
    selected_platforms: list[str] | None = None
    desktop_config: dict | None = None
    custom_user_agent: str | None = None


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


class AppConfigResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    url: str
    package_name: str | None = None
    description: str | None = None
    icon_url: str | None = None
    splash_url: str | None = None
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
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppConfigListResponse(BaseModel):
    apps: list[AppConfigResponse]
    total: int
