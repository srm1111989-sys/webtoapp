import json
import uuid
import logging
from io import BytesIO
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.app_config import AppConfig
from app.models.pwa_config import PWAConfig
from app.utils.storage import upload_file
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.pwa")

ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

SERVICE_WORKER_TEMPLATE = """
const CACHE_NAME = '{app_name}-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', (event) => {{
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
}});

self.addEventListener('activate', (event) => {{
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(keyList.map((key) => {{
        if (key !== CACHE_NAME) return caches.delete(key);
      }}))
    )
  );
  self.clients.claim();
}});

self.addEventListener('fetch', (event) => {{
  if (event.request.mode === 'navigate') {{
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }}
}});
"""

OFFLINE_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{app_name} - Offline</title>
  <style>
    body {{ display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui; background: {bg_color}; color: white; text-align: center; }}
    .container {{ padding: 2rem; }}
    h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem; }}
    p {{ opacity: 0.8; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>{app_name}</h1>
    <p>You are currently offline. Please check your internet connection.</p>
  </div>
</body>
</html>
"""


async def generate_pwa(app_config_id: uuid.UUID, db: AsyncSession) -> PWAConfig:
    """Generate PWA assets (manifest, service worker, icons) for an app."""
    result = await db.execute(select(AppConfig).where(AppConfig.id == app_config_id))
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise ValueError(f"App config {app_config_id} not found")

    folder = f"pwa/{app_config_id}"
    icons_urls = {}

    # Resize and upload icons if icon exists
    if app_config.icon_url:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(app_config.icon_url)
                icon_bytes = response.content

            img = Image.open(BytesIO(icon_bytes))
            for size in ICON_SIZES:
                resized = img.resize((size, size), Image.LANCZOS)
                buf = BytesIO()
                resized.save(buf, format="PNG")
                url = await upload_file(buf.getvalue(), folder, f"icon-{size}x{size}.png", "image/png")
                if url:
                    icons_urls[f"{size}x{size}"] = url
        except Exception as e:
            logger.error(f"Failed to process icon for {app_config_id}: {e}")

    # Build manifest
    manifest = {
        "name": app_config.name,
        "short_name": app_config.name[:12],
        "description": app_config.description or f"{app_config.name} - Progressive Web App",
        "start_url": app_config.url,
        "scope": app_config.url,
        "display": "standalone",
        "orientation": "portrait",
        "theme_color": app_config.primary_color,
        "background_color": "#ffffff",
        "icons": [
            {"src": url, "sizes": size, "type": "image/png", "purpose": "any maskable"}
            for size, url in icons_urls.items()
        ],
    }

    manifest_bytes = json.dumps(manifest, indent=2).encode()
    manifest_url = await upload_file(manifest_bytes, folder, "manifest.json", "application/json")

    # Service worker
    sw_content = SERVICE_WORKER_TEMPLATE.format(app_name=app_config.name.replace("'", "\\'"))
    sw_url = await upload_file(sw_content.encode(), folder, "sw.js", "application/javascript")

    # Offline page
    offline_html = OFFLINE_HTML_TEMPLATE.format(
        app_name=app_config.name,
        bg_color=app_config.primary_color,
    )
    offline_url = await upload_file(offline_html.encode(), folder, "offline.html", "text/html")

    # Save PWA config
    result = await db.execute(select(PWAConfig).where(PWAConfig.app_config_id == app_config_id))
    pwa_config = result.scalar_one_or_none()

    if pwa_config:
        pwa_config.manifest = manifest
        pwa_config.manifest_url = manifest_url
        pwa_config.service_worker_url = sw_url
        pwa_config.icons_urls = icons_urls
        pwa_config.offline_page_url = offline_url
        pwa_config.status = "generated"
    else:
        pwa_config = PWAConfig(
            app_config_id=app_config_id,
            manifest=manifest,
            manifest_url=manifest_url,
            service_worker_url=sw_url,
            icons_urls=icons_urls,
            offline_page_url=offline_url,
            status="generated",
        )
        db.add(pwa_config)

    await db.flush()
    await db.refresh(pwa_config)
    return pwa_config
