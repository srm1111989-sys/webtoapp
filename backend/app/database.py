from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Main engine for FastAPI (connection pooling)
_engine_kwargs = dict(echo=settings.debug)
if not settings.database_url.startswith("sqlite"):
    _engine_kwargs.update(pool_size=20, max_overflow=10)

engine = create_async_engine(settings.database_url, **_engine_kwargs)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Celery engine — uses NullPool to avoid connection sharing across event loops
# This fixes "cannot perform operation: another operation is in progress"
_celery_kwargs = dict(echo=False)
if not settings.database_url.startswith("sqlite"):
    _celery_kwargs.update(poolclass=NullPool)

celery_engine = create_async_engine(settings.database_url, **_celery_kwargs)

celery_async_session = async_sessionmaker(celery_engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
