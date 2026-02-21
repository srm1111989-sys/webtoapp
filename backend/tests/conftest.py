import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock


@pytest.fixture
def sample_app_config():
    """Create a sample AppConfig-like mock for testing."""
    config = MagicMock()
    config.id = uuid.uuid4()
    config.user_id = uuid.uuid4()
    config.name = "Test App"
    config.url = "https://example.com"
    config.package_name = "com.example.testapp"
    config.description = "A test application"
    config.icon_url = "https://cdn.example.com/icon.png"
    config.splash_url = "https://cdn.example.com/splash.png"
    config.primary_color = "#2563EB"
    config.secondary_color = "#1E40AF"
    config.status_bar_color = "#1E3A5F"
    config.navigation_type = "bottom_nav"
    config.navigation_items = [{"label": "Home", "url": "/"}]
    config.features = {
        "push_notifications": True,
        "biometric_auth": False,
        "admob": True,
    }
    config.firebase_config = {"server_key": "test-key"}
    config.admob_config = {"app_id": "ca-app-pub-123"}
    config.custom_user_agent = "TestAgent/1.0"
    return config


@pytest.fixture
def sample_order(sample_app_config):
    """Create a sample Order-like mock for testing."""
    order = MagicMock()
    order.id = uuid.uuid4()
    order.user_id = sample_app_config.user_id
    order.app_config_id = sample_app_config.id
    order.status = "paid"
    return order


@pytest.fixture
def mock_db():
    """Create a mock async database session."""
    db = AsyncMock()
    return db
