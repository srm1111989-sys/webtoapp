"""Seed database with initial data."""
import asyncio
from sqlalchemy import select, update
from app.database import async_session
from app.models.admin import Admin
from app.models.plan import Plan
from app.utils.security import hash_password
from app.config import get_settings

settings = get_settings()

OLD_PLAN_SLUGS = ["free", "one-time", "pro", "business", "play-store-submission"]

PLANS = [
    {
        "name": "Android Free",
        "slug": "android-free",
        "description": "Build up to 5 apps with watermark & 3-day trial",
        "price_inr": 0,
        "price_usd": 0,
        "billing_type": "one_time",
        "max_apps": 5,
        "platform": "android",
        "sort_order": 1,
        "features": {
            "twa": True,
            "webview_fallback": True,
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "fullscreen": True,
            "orientation_lock": True,
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
        "name": "Android Paid",
        "slug": "android-paid",
        "description": "All features, one-time payment",
        "price_inr": 207500,   # ₹2075 (~$25 at ₹83/USD)
        "price_usd": 2500,     # $25 in cents
        "billing_type": "one_time",
        "max_apps": 1,
        "platform": "android",
        "sort_order": 2,
        "features": {
            "twa": True,
            "webview_fallback": True,
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "fullscreen": True,
            "orientation_lock": True,
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
        "name": "Play Store Listing",
        "slug": "play-store-listing",
        "description": "We publish your app to Google Play Store on your behalf",
        "price_inr": 124500,   # ₹1245 (~$15)
        "price_usd": 1500,     # $15 in cents
        "billing_type": "one_time",
        "max_apps": 1,
        "platform": "android",
        "sort_order": 3,
        "features": {
            "play_store_listing": True,
        },
    },
    {
        "name": "Desktop Free",
        "slug": "desktop-free",
        "description": "Build up to 5 apps with watermark & 3-day trial",
        "price_inr": 0,
        "price_usd": 0,
        "billing_type": "one_time",
        "max_apps": 5,
        "platform": "desktop",
        "sort_order": 4,
        "features": {
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "fullscreen": True,
            "watermark": True,
            "trial_days": 3,
            "system_tray": False,
            "custom_window_size": False,
            "auto_updater": False,
            "native_notifications": False,
            "file_associations": False,
            "protocol_handler": False,
            "kiosk_mode": False,
        },
    },
    {
        "name": "Desktop Paid",
        "slug": "desktop-paid",
        "description": "Full desktop app, one-time",
        "price_inr": 207500,   # ₹2075 (~$25 at ₹83/USD)
        "price_usd": 2500,     # $25 in cents
        "billing_type": "one_time",
        "max_apps": 1,
        "platform": "desktop",
        "sort_order": 5,
        "features": {
            "custom_icon": True,
            "custom_splash": True,
            "custom_colors": True,
            "fullscreen": True,
            "watermark": False,
            "trial_days": 0,
            "system_tray": True,
            "custom_window_size": True,
            "auto_updater": True,
            "native_notifications": True,
            "file_associations": True,
            "protocol_handler": True,
            "kiosk_mode": True,
            "custom_title_bar": True,
            "multi_window": True,
            "tray_menu": True,
            "startup_launch": True,
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

        # Deactivate old plans (preserve FK integrity for existing orders)
        await session.execute(
            update(Plan)
            .where(Plan.slug.in_(OLD_PLAN_SLUGS), Plan.is_active == True)
            .values(is_active=False)
        )
        print("Old plans deactivated (free, one-time, pro, business)")

        # Upsert new plans (by slug)
        for plan_data in PLANS:
            result = await session.execute(select(Plan).where(Plan.slug == plan_data["slug"]))
            existing = result.scalar_one_or_none()
            if existing:
                for key, value in plan_data.items():
                    setattr(existing, key, value)
                existing.is_active = True
                print(f"Plan updated: {plan_data['name']}")
            else:
                plan = Plan(**plan_data)
                session.add(plan)
                print(f"Plan created: {plan_data['name']}")

        await session.commit()
        print("Seed completed: 5 plans active, old plans deactivated.")


if __name__ == "__main__":
    asyncio.run(seed())
