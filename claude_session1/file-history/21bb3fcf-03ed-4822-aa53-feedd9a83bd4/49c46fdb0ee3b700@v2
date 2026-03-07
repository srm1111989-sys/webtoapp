// app/sitemap.xml/route.js - Dynamic sitemap for Next.js
// Or use this as standalone script

import fs from 'fs';
import path from 'path';

// Import content schedule
const CONTENT_SCHEDULE = {
  // Homepage & static pages
  '/': { date: '2026-02-27', priority: '1.0', changefreq: 'daily' },
  '/pricing': { date: '2026-03-01', priority: '0.9', changefreq: 'weekly' },
  '/features': { date: '2026-02-28', priority: '0.8', changefreq: 'monthly' },

  // Week 1 - Pillar Posts
  '/blog/convert-website-to-android-app-2026': {
    date: '2026-03-01',
    priority: '1.0',
    changefreq: 'weekly',
  },
  '/blog/wordpress-to-android-app': {
    date: '2026-03-03',
    priority: '1.0',
    changefreq: 'weekly',
  },
  '/blog/shopify-to-mobile-app': {
    date: '2026-03-04',
    priority: '1.0',
    changefreq: 'weekly',
  },

  // Week 2
  '/blog/turn-website-into-mobile-app': {
    date: '2026-03-06',
    priority: '0.9',
    changefreq: 'weekly',
  },
  '/blog/website-to-app-without-coding': {
    date: '2026-03-07',
    priority: '0.9',
    changefreq: 'weekly',
  },
  '/blog/best-website-to-app-converters-2026': {
    date: '2026-03-08',
    priority: '1.0',
    changefreq: 'weekly',
  },

  // Add all your content here...
};

/**
 * Generate sitemap XML with only published content
 */
function generateSitemap() {
  const baseUrl = 'https://websitetoapp.app';
  const today = new Date().toISOString().split('T')[0];

  // Filter published content only
  const publishedUrls = Object.entries(CONTENT_SCHEDULE)
    .filter(([url, data]) => data.date <= today)
    .map(([url, data]) => ({
      url,
      lastmod: data.date,
      changefreq: data.changefreq,
      priority: data.priority,
    }));

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publishedUrls
  .map(
    (item) => `  <url>
    <loc>${baseUrl}${item.url}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

/**
 * Next.js App Router: app/sitemap.xml/route.js
 */
export async function GET() {
  const sitemap = generateSitemap();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

/**
 * Standalone script: node sitemap-generator.js
 */
if (require.main === module) {
  const sitemap = generateSitemap();
  fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap);
  console.log('✅ Sitemap generated at public/sitemap.xml');
  console.log(`📊 Total URLs: ${sitemap.match(/<url>/g).length}`);
}

export default generateSitemap;
