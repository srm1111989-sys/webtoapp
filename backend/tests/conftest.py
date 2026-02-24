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
        "deep_linking": True,
        "offline_mode": True,
        "screenshot_prevention": False,
        "file_upload": True,
        "location_services": True,
        "camera_access": True,
        "qr_scanner": False,
        "js_bridge": False,
        "navigation_menu": True,
        "onboarding_screen": True,
        "app_shortcut": True,
        "secondary_navigation": True,
        "social_login": True,
        "in_app_update": True,
        "background_location": True,
        "facebook_app_events": True,
        "in_app_purchases": True,
        "in_app_review": True,
        "background_service": True,
        "native_contacts": True,
        "appsflyer": True,
        "custom_media_player": True,
        "offer_card": True,
        "intercom": True,
        "dynamic_app_icon": True,
        "bluetooth_connectivity": True,
        "download_file_manager": True,
        "floating_action_menu": True,
        "revenue_cat": True,
        "native_datastore": True,
        "passcode_lock": True,
        "app_auto_launch": True,
        "advanced_bottom_navigation": True,
        "firebase_notification": True,
        "tap_to_pay": True,
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
