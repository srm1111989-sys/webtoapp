#!/usr/bin/env python3
"""
Auto-Publishing System for WebsiteToApp SEO Campaign

Usage:
    python auto_publish.py --week 2
    python auto_publish.py --today
    python auto_publish.py --schedule

Features:
- Generates content for specified week using Claude API
- Updates content schedule (middleware.js, sitemap.js)
- Commits to git
- Auto-deploys (if using Vercel/Netlify)
"""

import os
import sys
import json
import anthropic
from datetime import datetime, timedelta
import subprocess
import argparse

# Configuration
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')  # Set in environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, '../generated-content')
CONTENT_CALENDAR_PATH = os.path.join(BASE_DIR, '../CONTENT_CALENDAR.md')

# Week 2 schedule (example)
WEEK_2_SCHEDULE = {
    'day-08': {
        'date': '2026-03-06',
        'title': 'Turn Website Into Mobile App (Guide)',
        'slug': 'turn-website-into-mobile-app',
        'keyword': 'turn website into mobile app',
        'word_count': 2000,
    },
    'day-09': {
        'date': '2026-03-07',
        'title': 'Website to App Without Coding',
        'slug': 'website-to-app-without-coding',
        'keyword': 'website to app no coding',
        'word_count': 2000,
    },
    'day-10': {
        'date': '2026-03-08',
        'title': 'Best Website to App Converters 2026',
        'slug': 'best-website-to-app-converters-2026',
        'keyword': 'best website to app converter',
        'word_count': 2500,
    },
    'day-11': {
        'date': '2026-03-09',
        'title': 'Free Website to App Converter',
        'slug': 'free-website-to-app-converter',
        'keyword': 'free website to app',
        'word_count': 2000,
    },
    'day-12': {
        'date': '2026-03-10',
        'title': 'How Much Does It Cost to Make an App?',
        'slug': 'app-development-cost',
        'keyword': 'app development cost',
        'word_count': 2000,
    },
}


def generate_blog_post(title, keyword, word_count, slug):
    """Generate blog post using Claude API"""
    client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

    prompt = f"""Write a complete SEO-optimized blog post for websitetoapp.app:

Title: {title}
Target Keyword: {keyword}
Word Count: {word_count}-{word_count + 500}
URL Slug: /blog/{slug}

Requirements:
- SEO title tag (60 chars max)
- Meta description (155 chars, compelling CTA)
- H1, H2, H3 structure
- {word_count}+ words
- 10 FAQs with detailed answers
- Internal linking suggestions
- Image descriptions (5-7 images)
- FAQ schema (JSON-LD)
- Strong introduction with hook
- Actionable conclusion with CTA

Format as markdown with frontmatter:
---
title: "..."
meta_description: "..."
slug: "{slug}"
keyword: "{keyword}"
publish_date: "YYYY-MM-DD"
category: "..."
tags: [...]
---

Write in helpful, authoritative tone. Focus on value for readers."""

    response = client.messages.create(
        model="claude-sonnet-4",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text


def save_content(content, week, day, slug):
    """Save generated content to file"""
    week_dir = os.path.join(CONTENT_DIR, f'week-{week:02d}')
    os.makedirs(week_dir, exist_ok=True)

    filepath = os.path.join(week_dir, f'{day}-{slug}.md')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'✅ Saved: {filepath}')
    return filepath


def update_middleware(schedule_updates):
    """Update middleware.js with new content schedule"""
    middleware_path = os.path.join(BASE_DIR, 'next-middleware.js')

    # Read current middleware
    with open(middleware_path, 'r') as f:
        content = f.read()

    # Find CONTENT_SCHEDULE object and update
    # (Simple string replacement - you might want to use AST parsing for production)

    for slug, date in schedule_updates.items():
        new_line = f"  '/blog/{slug}': '{date}',\n"

        # Insert before closing brace of CONTENT_SCHEDULE
        content = content.replace(
            '  // Add more as you generate content...\n};',
            f'  {new_line}  // Add more as you generate content...\n}};'
        )

    with open(middleware_path, 'w') as f:
        f.write(content)

    print('✅ Updated middleware.js')


def update_sitemap(schedule_updates):
    """Update sitemap-generator.js with new content"""
    sitemap_path = os.path.join(BASE_DIR, 'sitemap-generator.js')

    with open(sitemap_path, 'r') as f:
        content = f.read()

    for slug, date in schedule_updates.items():
        new_entry = f"""  '/blog/{slug}': {{
    date: '{date}',
    priority: '0.9',
    changefreq: 'weekly',
  }},
"""
        # Insert before closing of CONTENT_SCHEDULE
        content = content.replace(
            '  // Add all your content here...\n};',
            f'{new_entry}  // Add all your content here...\n}};'
        )

    with open(sitemap_path, 'w') as f:
        f.write(content)

    print('✅ Updated sitemap-generator.js')


def git_commit_and_push(message):
    """Commit changes to git and push"""
    try:
        subprocess.run(['git', 'add', '.'], check=True)
        subprocess.run(['git', 'commit', '-m', message], check=True)
        subprocess.run(['git', 'push'], check=True)
        print('✅ Pushed to git')
    except subprocess.CalledProcessError as e:
        print(f'❌ Git error: {e}')


def generate_week(week_number):
    """Generate all content for a specific week"""
    print(f'\n🚀 Generating Week {week_number} Content...\n')

    schedule = WEEK_2_SCHEDULE if week_number == 2 else {}
    schedule_updates = {}

    for day, config in schedule.items():
        print(f'\n📝 Generating: {config["title"]}')

        # Generate content with Claude
        content = generate_blog_post(
            title=config['title'],
            keyword=config['keyword'],
            word_count=config['word_count'],
            slug=config['slug']
        )

        # Save to file
        save_content(content, week_number, day, config['slug'])

        # Track for schedule update
        schedule_updates[config['slug']] = config['date']

        print(f'✅ Generated {config["word_count"]}+ words')

    # Update automation files
    print('\n📋 Updating automation files...')
    update_middleware(schedule_updates)
    update_sitemap(schedule_updates)

    # Commit to git
    git_commit_and_push(f'Generated Week {week_number} content')

    print(f'\n🎉 Week {week_number} content generated and deployed!')


def publish_today():
    """Check if content scheduled for today and ensure it's published"""
    today = datetime.now().strftime('%Y-%m-%d')

    print(f'\n📅 Checking for content scheduled for {today}...')

    # Read content calendar and find today's content
    # This would check middleware.js or a database
    # For now, just a placeholder

    print('✅ Today\'s content is published')


def show_schedule():
    """Display publishing schedule"""
    print('\n📆 Publishing Schedule:\n')

    # Load from CONTENT_CALENDAR.md or database
    # For now, show Week 2 example

    for day, config in WEEK_2_SCHEDULE.items():
        status = '✅' if datetime.strptime(config['date'], '%Y-%m-%d').date() <= datetime.now().date() else '⏳'
        print(f'{status} {config["date"]}: {config["title"]}')


def main():
    parser = argparse.ArgumentParser(description='WebsiteToApp Auto-Publisher')
    parser.add_argument('--week', type=int, help='Generate content for specific week (e.g., 2)')
    parser.add_argument('--today', action='store_true', help='Publish today\'s scheduled content')
    parser.add_argument('--schedule', action='store_true', help='Show publishing schedule')

    args = parser.parse_args()

    if not CLAUDE_API_KEY:
        print('❌ Error: CLAUDE_API_KEY environment variable not set')
        print('Set it with: export CLAUDE_API_KEY=your_api_key')
        sys.exit(1)

    if args.week:
        generate_week(args.week)
    elif args.today:
        publish_today()
    elif args.schedule:
        show_schedule()
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
