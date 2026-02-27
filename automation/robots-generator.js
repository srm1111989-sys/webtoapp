// app/robots.txt/route.js - Dynamic robots.txt for Next.js
// Or use as standalone script

/**
 * Generate robots.txt dynamically
 */
function generateRobotsTxt() {
  const baseUrl = 'https://websitetoapp.app';

  const robotsTxt = `# Robots.txt for WebsiteToApp.app
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin/private pages
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/
Disallow: /coming-soon

# Disallow unpublished content (optional - middleware already handles this)
# Disallow: /drafts/

# Allow important directories
Allow: /blog/
Allow: /convert/
Allow: /solutions/
Allow: /features/
Allow: /pricing

# Crawl-delay for specific bots (optional)
User-agent: Bingbot
Crawl-delay: 1

User-agent: Googlebot
Allow: /

# Block bad bots (optional)
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 2
`;

  return robotsTxt;
}

/**
 * Next.js App Router: app/robots.txt/route.js
 */
export async function GET() {
  const robots = generateRobotsTxt();

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
    },
  });
}

/**
 * Standalone script: node robots-generator.js
 */
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const robots = generateRobotsTxt();
  fs.writeFileSync(path.join(__dirname, '../public/robots.txt'), robots);
  console.log('✅ robots.txt generated at public/robots.txt');
}

export default generateRobotsTxt;
