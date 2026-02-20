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
            "source_code": False,
            "aab_output": False,
            "pwa": False,
            "priority_support": False,
        },
    },
    {
        "name": "Basic",
        "slug": "basic",
        "description": "Perfect for personal projects and small businesses",
        "price_inr": 299900,  # 2999 INR in paise
        "price_usd": 3500,    # $35 in cents
        "billing_type": "one_time",
        "max_apps": 3,
        "sort_order": 1,
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
            "source_code": False,
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
            "source_code": False,
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
            "source_code": True,
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
