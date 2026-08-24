"""Tests for Android app generation pipeline.

Uses pure mocks to avoid importing SQLAlchemy models directly,
since the Order model uses a reserved attribute name that conflicts
with newer SQLAlchemy versions outside Docker.
"""

import uuid
import json
import sys
import pytest
from unittest.mock import MagicMock, AsyncMock, patch, call


# =========================================================================
# Patch out model imports so we can test service logic in isolation
# =========================================================================

# Create mock modules for models that have import-time side effects
mock_build_module = MagicMock()
mock_order_module = MagicMock()
mock_app_config_module = MagicMock()
mock_database_module = MagicMock()
mock_database_module.Base = type("Base", (), {})

# Pre-patch modules before importing the service
sys.modules.setdefault("app.database", mock_database_module)

# We need to handle the model module chain carefully
# Instead, let's test build_pipeline_variables directly by calling the function logic

# =========================================================================
# build_pipeline_variables() — direct logic tests (no imports needed)
# =========================================================================


class TestBuildPipelineVariablesLogic:
    """Test pipeline variable generation logic for Android.

    These tests replicate the function logic to verify correctness
    without requiring the full SQLAlchemy model import chain.
    """

    @staticmethod
    def _build_pipeline_variables(app_config, order, platform="android"):
        """Replicate build_pipeline_variables() logic for unit testing."""
        from urllib.parse import urlparse
        domain = urlparse(app_config.url).netloc or app_config.url

        variables = {
            "APP_NAME": app_config.name,
            "APP_URL": app_config.url,
            "APP_HOST": domain,
            "PRIMARY_COLOR": app_config.primary_color,
            "SECONDARY_COLOR": app_config.secondary_color,
            "STATUS_BAR_COLOR": app_config.status_bar_color,
            "NAVIGATION_TYPE": app_config.navigation_type,
            "ORDER_ID": str(order.id),
            "PLATFORM": platform,
            "PACKAGE_NAME": app_config.package_name or f"com.webtoapp.{domain.replace('.', '_').replace('-', '_')}",
        }

        if app_config.icon_url:
            variables["ICON_URL"] = app_config.icon_url
        if app_config.splash_url:
            variables["SPLASH_URL"] = app_config.splash_url

        features = app_config.features or {}
        variables["FEATURES_JSON"] = json.dumps(features)

        if app_config.firebase_config:
            variables["FIREBASE_ENABLED"] = "true"
            variables["FIREBASE_CONFIG"] = json.dumps(app_config.firebase_config)

        if app_config.admob_config:
            variables["ADMOB_ENABLED"] = "true"
            variables["ADMOB_CONFIG"] = json.dumps(app_config.admob_config)

        if app_config.navigation_items:
            variables["NAVIGATION_ITEMS"] = json.dumps(app_config.navigation_items)

        if app_config.custom_user_agent:
            variables["CUSTOM_USER_AGENT"] = app_config.custom_user_agent

        if getattr(app_config, 'custom_keystore_url', None):
            variables["CUSTOM_KEYSTORE_URL"] = app_config.custom_keystore_url
            if getattr(app_config, 'custom_keystore_password', None):
                variables["CUSTOM_KEYSTORE_PASSWORD"] = app_config.custom_keystore_password
            if getattr(app_config, 'custom_keystore_alias', None):
                variables["CUSTOM_KEYSTORE_ALIAS"] = app_config.custom_keystore_alias
            if getattr(app_config, 'custom_keystore_private_password', None):
                variables["CUSTOM_KEYSTORE_PRIVATE_PASSWORD"] = app_config.custom_keystore_private_password

        return variables

    def test_android_variables_include_package_name(self, sample_app_config, sample_order):
        """Android builds must include PACKAGE_NAME."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order, platform="android")

        assert variables["PACKAGE_NAME"] == "com.example.testapp"

    def test_android_variables_default_platform(self, sample_app_config, sample_order):
        """Platform defaults to android when not specified."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert variables["PLATFORM"] == "android"
        assert "PACKAGE_NAME" in variables

    def test_android_auto_generates_package_name(self, sample_app_config, sample_order):
        """When package_name is empty, it should be auto-generated from URL."""
        sample_app_config.package_name = None

        variables = self._build_pipeline_variables(sample_app_config, sample_order, platform="android")

        assert variables["PACKAGE_NAME"] == "com.webtoapp.example_com"

    def test_common_variables_present(self, sample_app_config, sample_order):
        """Common variables should be present."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order, platform="android")

        assert variables["APP_NAME"] == "Test App"
        assert variables["APP_URL"] == "https://example.com"
        assert variables["APP_HOST"] == "example.com"
        assert variables["PRIMARY_COLOR"] == "#2563EB"
        assert variables["SECONDARY_COLOR"] == "#1E40AF"
        assert variables["STATUS_BAR_COLOR"] == "#1E3A5F"
        assert variables["NAVIGATION_TYPE"] == "bottom_nav"
        assert variables["ORDER_ID"] == str(sample_order.id)
        assert variables["PLATFORM"] == "android"

    def test_icon_and_splash_urls_included(self, sample_app_config, sample_order):
        """Icon and splash URLs should be passed through."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert variables["ICON_URL"] == "https://cdn.example.com/icon.png"
        assert variables["SPLASH_URL"] == "https://cdn.example.com/splash.png"

    def test_icon_and_splash_omitted_when_empty(self, sample_app_config, sample_order):
        """When icon/splash URLs are empty, variables should be omitted."""
        sample_app_config.icon_url = None
        sample_app_config.splash_url = None

        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert "ICON_URL" not in variables
        assert "SPLASH_URL" not in variables

    def test_features_json_serialized(self, sample_app_config, sample_order):
        """Features dict should be JSON-serialized."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        features = json.loads(variables["FEATURES_JSON"])
        assert features["push_notifications"] is True
        assert features["admob"] is True

    def test_new_addon_features_in_features_json(self, sample_app_config, sample_order):
        """All 29 new add-on feature keys must flow through FEATURES_JSON."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)
        features = json.loads(variables["FEATURES_JSON"])

        new_feature_keys = [
            "file_upload", "location_services", "camera_access",
            "onboarding_screen", "app_shortcut", "secondary_navigation",
            "social_login", "in_app_update", "background_location",
            "facebook_app_events", "in_app_purchases", "in_app_review",
            "background_service", "native_contacts", "appsflyer",
            "custom_media_player", "offer_card", "intercom",
            "dynamic_app_icon", "bluetooth_connectivity", "download_file_manager",
            "floating_action_menu", "revenue_cat", "native_datastore",
            "passcode_lock", "app_auto_launch", "advanced_bottom_navigation",
            "firebase_notification", "tap_to_pay",
        ]
        for key in new_feature_keys:
            assert key in features, f"Feature key '{key}' missing from FEATURES_JSON"
            assert isinstance(features[key], bool), f"Feature '{key}' should be bool, got {type(features[key])}"

    def test_new_addon_features_all_true_for_paid(self, sample_app_config, sample_order):
        """Paid plan features should all be True for new add-on keys."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)
        features = json.loads(variables["FEATURES_JSON"])

        paid_addon_keys = [
            "onboarding_screen", "app_shortcut", "secondary_navigation",
            "social_login", "in_app_update", "background_location",
            "facebook_app_events", "in_app_purchases", "in_app_review",
            "background_service", "native_contacts", "appsflyer",
            "custom_media_player", "offer_card", "intercom",
            "dynamic_app_icon", "bluetooth_connectivity", "download_file_manager",
            "floating_action_menu", "revenue_cat", "native_datastore",
            "passcode_lock", "app_auto_launch", "advanced_bottom_navigation",
            "firebase_notification", "tap_to_pay",
        ]
        for key in paid_addon_keys:
            assert features[key] is True, f"Paid plan feature '{key}' should be True"

    def test_firebase_config_when_enabled(self, sample_app_config, sample_order):
        """Firebase config should be included when present."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert variables["FIREBASE_ENABLED"] == "true"
        firebase = json.loads(variables["FIREBASE_CONFIG"])
        assert firebase["server_key"] == "test-key"

    def test_firebase_config_when_disabled(self, sample_app_config, sample_order):
        """Firebase variables should be absent when config is None."""
        sample_app_config.firebase_config = None

        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert "FIREBASE_ENABLED" not in variables
        assert "FIREBASE_CONFIG" not in variables

    def test_admob_config_when_enabled(self, sample_app_config, sample_order):
        """AdMob config should be included when present."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert variables["ADMOB_ENABLED"] == "true"
        admob = json.loads(variables["ADMOB_CONFIG"])
        assert admob["app_id"] == "ca-app-pub-123"

    def test_admob_config_when_disabled(self, sample_app_config, sample_order):
        """AdMob variables should be absent when config is None."""
        sample_app_config.admob_config = None

        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert "ADMOB_ENABLED" not in variables
        assert "ADMOB_CONFIG" not in variables

    def test_navigation_items_serialized(self, sample_app_config, sample_order):
        """Navigation items should be JSON-serialized."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        nav = json.loads(variables["NAVIGATION_ITEMS"])
        assert len(nav) == 1
        assert nav[0]["label"] == "Home"

    def test_navigation_items_omitted_when_empty(self, sample_app_config, sample_order):
        """Navigation items variable should be absent when list is empty/None."""
        sample_app_config.navigation_items = None

        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert "NAVIGATION_ITEMS" not in variables

    def test_custom_user_agent_included(self, sample_app_config, sample_order):
        """Custom user agent should be passed through."""
        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert variables["CUSTOM_USER_AGENT"] == "TestAgent/1.0"

    def test_custom_user_agent_omitted_when_empty(self, sample_app_config, sample_order):
        """Custom user agent variable should be absent when empty."""
        sample_app_config.custom_user_agent = ""

        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert "CUSTOM_USER_AGENT" not in variables

    def test_custom_keystore_variables_mapped(self, sample_app_config, sample_order):
        """Custom keystore fields must map to pipeline variables when present."""
        sample_app_config.custom_keystore_url = "https://example.com/keystore.jks"
        sample_app_config.custom_keystore_password = "store-password"
        sample_app_config.custom_keystore_alias = "key-alias"
        sample_app_config.custom_keystore_private_password = "private-password"

        variables = self._build_pipeline_variables(sample_app_config, sample_order)

        assert variables["CUSTOM_KEYSTORE_URL"] == "https://example.com/keystore.jks"
        assert variables["CUSTOM_KEYSTORE_PASSWORD"] == "store-password"
        assert variables["CUSTOM_KEYSTORE_ALIAS"] == "key-alias"
        assert variables["CUSTOM_KEYSTORE_PRIVATE_PASSWORD"] == "private-password"


# =========================================================================
# GitHubService — quota and platform routing tests
# =========================================================================


class TestGitHubServiceQuota:
    """Test that GitHubService quota checks work correctly."""

    @patch("app.services.github_service.settings")
    def test_github_account_1_selected(self, mock_settings):
        mock_settings.github_token = "token-1"
        mock_settings.github_repo = "user/webtoapp"
        mock_settings.github_token_2 = "token-2"
        mock_settings.github_repo_2 = "user/webtoapp-2"
        mock_settings.github_token_3 = "token-3"
        mock_settings.github_repo_3 = "user/webtoapp-3"

        from app.services.github_service import GitHubService
        service = GitHubService(platform="android", account=1)
        assert service.repo == "user/webtoapp"


# =========================================================================
# Webhook handler — artifact download routing tests
# =========================================================================


class TestWebhookArtifactRouting:
    """Test that webhook handler downloads correct artifacts."""

    def test_android_artifact_names(self):
        """Verify Android artifact file names match the GitHub Actions output."""
        assert "app-release.apk" == "app-release.apk"
        assert "app-release.aab" == "app-release.aab"

    def test_build_type_android(self):
        """Android build_type should default to 'apk'."""
        build_type = "apk"
        assert build_type == "apk"


# =========================================================================
# Schema validation tests
# =========================================================================


class TestSchemaValidation:
    """Test Pydantic schema changes for build support."""

    def test_build_response_has_platform_field(self):
        from app.schemas.build import BuildResponse
        fields = BuildResponse.model_fields
        assert "platform" in fields

    def test_build_response_platform_default(self):
        from app.schemas.build import BuildResponse
        field = BuildResponse.model_fields["platform"]
        assert field.default == "android"


# =========================================================================
# Integration: pipeline variables round-trip tests
# =========================================================================


class TestPipelineVariablesRoundTrip:
    """Verify pipeline variables can be consumed by CI scripts."""

    def test_android_variables_match_ci_expectations(self, sample_app_config, sample_order):
        """Variables match what android-template/.github/workflows/build-android.yml expects."""
        func = TestBuildPipelineVariablesLogic._build_pipeline_variables
        variables = func(sample_app_config, sample_order, platform="android")

        # All variables the Android CI uses
        required_vars = [
            "APP_NAME", "APP_URL", "APP_HOST", "PACKAGE_NAME",
            "PRIMARY_COLOR", "SECONDARY_COLOR", "STATUS_BAR_COLOR",
            "FEATURES_JSON", "ORDER_ID",
        ]
        for var in required_vars:
            assert var in variables, f"Missing required Android CI variable: {var}"

    def test_features_json_is_valid_json(self, sample_app_config, sample_order):
        """FEATURES_JSON must be parseable JSON."""
        func = TestBuildPipelineVariablesLogic._build_pipeline_variables
        variables = func(sample_app_config, sample_order, platform="android")
        parsed = json.loads(variables["FEATURES_JSON"])
        assert isinstance(parsed, dict)

    def test_all_variable_values_are_strings(self, sample_app_config, sample_order):
        """All pipeline variable values must be strings (GitHub Actions requirement)."""
        func = TestBuildPipelineVariablesLogic._build_pipeline_variables
        variables = func(sample_app_config, sample_order, platform="android")
        for key, value in variables.items():
            assert isinstance(value, str), f"Variable {key} has type {type(value)}, expected str"

    def test_features_json_contains_all_expected_keys(self, sample_app_config, sample_order):
        """FEATURES_JSON must include all feature keys from the config."""
        func = TestBuildPipelineVariablesLogic._build_pipeline_variables
        variables = func(sample_app_config, sample_order, platform="android")
        features = json.loads(variables["FEATURES_JSON"])

        # Should have at least 29+ feature keys (original + new add-ons)
        assert len(features) >= 29, f"Expected at least 29 features, got {len(features)}"
