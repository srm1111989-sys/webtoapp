"""
Blog/SEO Content Router with Date-Based Publishing
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, date
from typing import Optional, Dict, List
from pydantic import BaseModel
import json
from pathlib import Path

router = APIRouter(
    prefix="/api/blog",
    tags=["blog"]
)

# Content schedule with publish dates
CONTENT_SCHEDULE = {
    # Week 1
    "pricing": {
        "slug": "pricing",
        "title": "How Much Does It Cost to Convert Website to App in 2026?",
        "publish_date": "2026-03-01",
        "category": "Pricing",
        "url": "/pricing",
    },
    "convert-website-to-android-app": {
        "slug": "convert-website-to-android-app",
        "title": "How to Convert Website to Android App in 2026 (Complete Guide)",
        "publish_date": "2026-03-02",
        "category": "Guides",
        "url": "/blog/convert-website-to-android-app",
    },
    "wordpress-to-android-app": {
        "slug": "wordpress-to-android-app",
        "title": "How to Convert WordPress Website to Android App in 2026",
        "publish_date": "2026-03-03",
        "category": "WordPress",
        "url": "/blog/wordpress-to-android-app",
    },
    "shopify-to-mobile-app": {
        "slug": "shopify-to-mobile-app",
        "title": "How to Convert Shopify Website to Mobile App in 2026",
        "publish_date": "2026-03-04",
        "category": "eCommerce",
        "url": "/blog/shopify-to-mobile-app",
    },
    # Add Week 2 and more as you generate them...
}


class BlogPost(BaseModel):
    slug: str
    title: str
    content: str
    meta_description: str
    keyword: str
    publish_date: str
    category: str
    tags: List[str]
    url: str


def is_published(publish_date_str: str) -> bool:
    """Check if content should be visible based on publish date"""
    try:
        publish_date = datetime.strptime(publish_date_str, "%Y-%m-%d").date()
        today = date.today()
        return today >= publish_date
    except:
        return False


def load_blog_content(slug: str) -> Optional[Dict]:
    """Load blog content from markdown file"""
    content_dir = Path(__file__).parent.parent.parent.parent / "generated-content"

    # Search in week folders
    for week_dir in content_dir.glob("week-*"):
        for md_file in week_dir.glob(f"*{slug}.md"):
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                frontmatter = parts[1].strip()
                markdown_content = parts[2].strip() if len(parts) > 2 else ""

                # Parse YAML-like frontmatter (simple parser)
                metadata = {}
                for line in frontmatter.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        metadata[key.strip()] = value.strip().strip('"\'')

                return {
                    **metadata,
                    'content': markdown_content
                }

    return None


@router.get("/posts")
async def get_published_posts():
    """Get all published blog posts"""
    today = date.today()

    published_posts = []
    for slug, info in CONTENT_SCHEDULE.items():
        if is_published(info['publish_date']):
            published_posts.append({
                "slug": slug,
                "title": info['title'],
                "publish_date": info['publish_date'],
                "category": info['category'],
                "url": info['url'],
            })

    # Sort by publish date (newest first)
    published_posts.sort(key=lambda x: x['publish_date'], reverse=True)

    return {"posts": published_posts, "count": len(published_posts)}


@router.get("/posts/{slug}")
async def get_blog_post(slug: str):
    """Get a specific blog post (only if published)"""

    # Check if slug exists in schedule
    if slug not in CONTENT_SCHEDULE:
        raise HTTPException(status_code=404, detail="Post not found")

    post_info = CONTENT_SCHEDULE[slug]

    # Check if published
    if not is_published(post_info['publish_date']):
        raise HTTPException(
            status_code=404,
            detail=f"This content will be available on {post_info['publish_date']}"
        )

    # Load content from file
    content_data = load_blog_content(slug)
    if not content_data:
        raise HTTPException(status_code=500, detail="Content file not found")

    return {
        **post_info,
        **content_data,
    }


@router.get("/schedule")
async def get_schedule():
    """Get publishing schedule (all content, including future)"""
    all_posts = []
    today = date.today()

    for slug, info in CONTENT_SCHEDULE.items():
        all_posts.append({
            **info,
            "is_published": is_published(info['publish_date']),
            "days_until_publish": (
                datetime.strptime(info['publish_date'], "%Y-%m-%d").date() - today
            ).days if not is_published(info['publish_date']) else 0
        })

    # Sort by publish date
    all_posts.sort(key=lambda x: x['publish_date'])

    return {
        "schedule": all_posts,
        "total": len(all_posts),
        "published": len([p for p in all_posts if p['is_published']]),
        "upcoming": len([p for p in all_posts if not p['is_published']])
    }


@router.get("/categories")
async def get_categories():
    """Get all categories with post counts"""
    categories = {}

    for slug, info in CONTENT_SCHEDULE.items():
        if is_published(info['publish_date']):
            category = info['category']
            if category not in categories:
                categories[category] = {"name": category, "count": 0, "posts": []}
            categories[category]['count'] += 1
            categories[category]['posts'].append({
                "slug": slug,
                "title": info['title'],
                "url": info['url']
            })

    return {"categories": list(categories.values())}
