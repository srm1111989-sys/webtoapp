"""
SEO Routes: Sitemap, Robots.txt
"""
from fastapi import APIRouter, Response
from datetime import date
from app.routers.blog import CONTENT_SCHEDULE, is_published

router = APIRouter(tags=["seo"])

BASE_URL = "https://websitetoapp.app"


@router.get("/sitemap.xml")
async def get_sitemap():
    """Generate dynamic sitemap with only published content"""

    # Static pages (always included)
    static_pages = [
        {"url": "/", "priority": "1.0", "changefreq": "daily", "lastmod": "2026-02-27"},
        {"url": "/features", "priority": "0.8", "changefreq": "monthly", "lastmod": "2026-02-27"},
        {"url": "/plans", "priority": "0.9", "changefreq": "weekly", "lastmod": "2026-02-27"},
        {"url": "/login", "priority": "0.6", "changefreq": "monthly", "lastmod": "2026-02-27"},
    ]

    # Published blog posts only
    blog_posts = []
    for slug, info in CONTENT_SCHEDULE.items():
        if is_published(info['publish_date']):
            blog_posts.append({
                "url": info['url'],
                "priority": "1.0" if "pillar" in slug else "0.9",
                "changefreq": "weekly",
                "lastmod": info['publish_date']
            })

    # Combine all URLs
    all_urls = static_pages + blog_posts

    # Generate XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for page in all_urls:
        xml += '  <url>\n'
        xml += f'    <loc>{BASE_URL}{page["url"]}</loc>\n'
        xml += f'    <lastmod>{page["lastmod"]}</lastmod>\n'
        xml += f'    <changefreq>{page["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{page["priority"]}</priority>\n'
        xml += '  </url>\n'

    xml += '</urlset>'

    return Response(
        content=xml,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        }
    )


@router.get("/robots.txt")
async def get_robots():
    """Generate dynamic robots.txt"""

    robots = f"""# Robots.txt for WebsiteToApp.app
# Generated: {date.today()}

User-agent: *
Allow: /

# Sitemap
Sitemap: {BASE_URL}/sitemap.xml

# Disallow admin/private pages
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

# Allow important directories
Allow: /blog/
Allow: /features/
Allow: /plans/
Allow: /pricing/

# Crawl-delay for specific bots
User-agent: Bingbot
Crawl-delay: 1

User-agent: Googlebot
Allow: /
"""

    return Response(
        content=robots,
        media_type="text/plain",
        headers={
            "Cache-Control": "public, max-age=86400, s-maxage=86400",  # 24 hours
        }
    )
