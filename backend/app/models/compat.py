"""Cross-database type compatibility.

Provides UUID and JSONB types that work with both PostgreSQL and SQLite.
"""
import sqlalchemy as sa
from app.config import get_settings

settings = get_settings()
_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    from sqlalchemy import JSON as JSONB
    from sqlalchemy import Uuid

    class UUID(Uuid):
        """UUID type compatible with SQLite (stores as CHAR(32))."""
        def __init__(self, as_uuid=True, **kwargs):
            super().__init__(**kwargs)
else:
    from sqlalchemy.dialects.postgresql import UUID, JSONB
