"""Seed database with initial data."""
import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models.admin import Admin
from app.models.plan import Plan
from app.utils.security import hash_password
from app.config import get_settings

settings = get_settings()

PLANS = [
    {
        "name": "Free",
        "slug": "free",
        "description": "Try WebToApp with basic features",
        "price_inr": 0,
        "price_usd": 0,
        "billing_type": "one_time",
        "max_apps": 1,
        "sort_order": 0,
        "features": {
            "twa": True,
            "webview_fallback": True,
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "push_notifications": False,
            "admob": False,
            "biometric_auth": False,
            "deep_linking": False,
            "offline_mode": False,
            "navigation_menu": False,
            "firebase": False,
            "qr_scanner": False,
            "js_bridge": False,
            "screenshot_prevention": False,
            "file_upload": False,
            "location_services": False,
            "camera_access": False,
            "onboarding_screen": False,
            "app_shortcut": False,
            "secondary_navigation": False,
            "social_login": False,
            "in_app_update": False,
            "background_location": False,
            "facebook_app_events": False,
            "in_app_purchases": False,
            "in_app_review": False,
            "background_service": False,
            "native_contacts": False,
            "appsflyer": False,
            "custom_media_player": False,
            "offer_card": False,
            "intercom": False,
            "dynamic_app_icon": False,
            "bluetooth_connectivity": False,
            "download_file_manager": False,
            "floating_action_menu": False,
            "revenue_cat": False,
            "native_datastore": False,
            "passcode_lock": False,
            "app_auto_launch": False,
            "advanced_bottom_navigation": False,
            "firebase_notification": False,
            "tap_to_pay": False,

            "aab_output": False,
            "pwa": False,
            "priority_support": False,
        },
    },
    {
        "name": "One Time",
        "slug": "one-time",
        "description": "Pay once, use forever",
        "price_inr": 299900,  # 2999 INR in paise
        "price_usd": 3500,    # $35 in cents
        "billing_type": "one_time",
        "max_apps": 3,
        "sort_order": 4,
        "features": {
            "twa": True,
            "webview_fallback": True,
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "push_notifications": True,
            "admob": True,
            "biometric_auth": False,
            "deep_linking": True,
            "offline_mode": True,
            "navigation_menu": True,
            "firebase": True,
            "qr_scanner": False,
            "js_bridge": False,
            "screenshot_prevention": False,
            "file_upload": True,
            "location_services": True,
            "camera_access": True,
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

            "aab_output": True,
            "pwa": True,
            "priority_support": False,
        },
    },
    {
        "name": "Pro",
        "slug": "pro",
        "description": "For professional developers and growing businesses",
        "price_inr": 49900,  # 499 INR/mo in paise
        "price_usd": 999,    # $9.99/mo in cents
        "billing_type": "monthly",
        "max_apps": 10,
        "sort_order": 2,
        "features": {
            "twa": True,
            "webview_fallback": True,
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "push_notifications": True,
            "admob": True,
            "biometric_auth": True,
            "deep_linking": True,
            "offline_mode": True,
            "navigation_menu": True,
            "firebase": True,
            "qr_scanner": True,
            "js_bridge": True,
            "screenshot_prevention": True,
            "file_upload": True,
            "location_services": True,
            "camera_access": True,
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

            "aab_output": True,
            "pwa": True,
            "priority_support": True,
        },
    },
    {
        "name": "Business",
        "slug": "business",
        "description": "Full-featured plan for agencies and enterprises",
        "price_inr": 99900,  # 999 INR/mo in paise
        "price_usd": 1999,   # $19.99/mo in cents
        "billing_type": "monthly",
        "max_apps": 50,
        "sort_order": 3,
        "features": {
            "twa": True,
            "webview_fallback": True,
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "push_notifications": True,
            "admob": True,
            "biometric_auth": True,
            "deep_linking": True,
            "offline_mode": True,
            "navigation_menu": True,
            "firebase": True,
            "qr_scanner": True,
            "js_bridge": True,
            "screenshot_prevention": True,
            "file_upload": True,
            "location_services": True,
            "camera_access": True,
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

            "aab_output": True,
            "pwa": True,
            "priority_support": True,
        },
    },
]


async def seed():
    async with async_session() as session:
        # Seed admin
        result = await session.execute(select(Admin).where(Admin.email == settings.admin_email))
        if not result.scalar_one_or_none():
            admin = Admin(
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                full_name="Admin",
                is_super=True,
            )
            session.add(admin)
            print(f"Admin created: {settings.admin_email}")

        # Seed plans
        for plan_data in PLANS:
            result = await session.execute(select(Plan).where(Plan.slug == plan_data["slug"]))
            if not result.scalar_one_or_none():
                plan = Plan(**plan_data)
                session.add(plan)
                print(f"Plan created: {plan_data['name']}")

        await session.commit()
        print("Seed completed.")


if __name__ == "__main__":
    asyncio.run(seed())
