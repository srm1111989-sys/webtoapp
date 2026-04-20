/**
 * Post-build script: generates static HTML files for /convert/* routes.
 * Googlebot sees unique title, meta description, H1, and content per page.
 * The SPA still hydrates on top for interactive functionality.
 *
 * Run after: vite build
 * Usage: node generate-static-pages.js
 */
const fs = require('fs');
const path = require('path');

// Read the built index.html as template
const distDir = path.join(__dirname, 'dist');
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Platform data (must match src/data/platforms.ts)
const platforms = [
  { slug: 'wordpress', name: 'WordPress', desc: 'Convert your WordPress website to a native Android app. Keep blog sync, WooCommerce support, and push notifications.' },
  { slug: 'shopify', name: 'Shopify', desc: 'Turn your Shopify store into an Android app. Full product catalog, cart, and checkout support.' },
  { slug: 'wix', name: 'Wix', desc: 'Convert your Wix website to Android app. No coding needed. Keep your Wix design and functionality.' },
  { slug: 'squarespace', name: 'Squarespace', desc: 'Convert Squarespace website to mobile app. Maintain your beautiful design on mobile devices.' },
  { slug: 'webflow', name: 'Webflow', desc: 'Turn your Webflow site into an Android app. Responsive design converts perfectly to mobile.' },
  { slug: 'weebly', name: 'Weebly', desc: 'Convert Weebly website to Android app. Simple one-click conversion with no coding.' },
  { slug: 'blogger', name: 'Blogger', desc: 'Turn your Blogger blog into a mobile app. Auto-sync posts and comments.' },
  { slug: 'html-website', name: 'HTML Website', desc: 'Convert any HTML website to Android APK. Works with static sites, PHP, and any web technology.' },
  { slug: 'react-website', name: 'React', desc: 'Convert React web app to native Android app. Full SPA support with offline mode.' },
  { slug: 'godaddy', name: 'GoDaddy', desc: 'Convert GoDaddy website to Android app. Works with GoDaddy Website Builder sites.' },
  { slug: 'restaurant-website', name: 'Restaurant Website', desc: 'Turn your restaurant website into a mobile app. Online ordering, menu, and reservations.' },
  { slug: 'church-website', name: 'Church Website', desc: 'Convert church website to app. Sermons, events, and donation features built-in.' },
  { slug: 'school-website', name: 'School Website', desc: 'Turn school website into mobile app. Notices, timetable, and parent communication.' },
  { slug: 'ecommerce-website', name: 'E-commerce Website', desc: 'Convert e-commerce website to Android app. Shopping cart, payments, and product catalog.' },
  { slug: 'news-website', name: 'News Website', desc: 'Convert news website to mobile app. Push notifications for breaking news.' },
  { slug: 'lovable', name: 'Lovable', desc: 'Convert Lovable app to Android APK. Take your AI-built web app to Google Play Store.' },
  { slug: 'bolt', name: 'Bolt.new', desc: 'Convert Bolt.new app to Android. Deploy your AI-generated app to mobile devices.' },
  { slug: 'v0', name: 'v0.dev', desc: 'Convert v0.dev app to Android APK. Turn your AI-designed UI into a native mobile app.' },
  { slug: 'bubble', name: 'Bubble', desc: 'Convert Bubble app to Android. Take your no-code web app to Google Play Store.' },
  { slug: 'replit', name: 'Replit', desc: 'Convert Replit app to Android APK. Deploy your Replit project as a mobile app.' },
  { slug: 'streamlit', name: 'Streamlit', desc: 'Convert Streamlit app to Android. Turn your data dashboard into a mobile app.' },
  { slug: 'glide', name: 'Glide', desc: 'Convert Glide app to native Android APK. Export your Glide app for Google Play.' },
  { slug: 'flutterflow', name: 'FlutterFlow', desc: 'Convert FlutterFlow app to Android APK. Alternative export for your FlutterFlow project.' },
  { slug: 'django', name: 'Django', desc: 'Convert Django web app to Android. Full backend support with offline mode.' },
  { slug: 'laravel', name: 'Laravel', desc: 'Convert Laravel website to Android app. Full PHP backend support.' },
  { slug: 'nextjs', name: 'Next.js', desc: 'Convert Next.js app to Android. SSR and static pages work perfectly in mobile.' },
  { slug: 'angular', name: 'Angular', desc: 'Convert Angular web app to Android APK. Full SPA support.' },
  { slug: 'vue', name: 'Vue.js', desc: 'Convert Vue.js app to Android. Single-page app converts to native mobile.' },
  { slug: 'notion', name: 'Notion', desc: 'Convert Notion page to Android app. Turn your Notion workspace into a mobile app.' },
  { slug: 'google-sites', name: 'Google Sites', desc: 'Convert Google Sites to Android app. Simple conversion with no coding.' },
  { slug: 'carrd', name: 'Carrd', desc: 'Convert Carrd site to Android app. Turn your one-page site into a mobile app.' },
  { slug: 'framer', name: 'Framer', desc: 'Convert Framer website to Android app. Your Framer design as a native app.' },
  { slug: 'woocommerce', name: 'WooCommerce', desc: 'Convert WooCommerce store to Android app. Full e-commerce support.' },
  { slug: 'website-to-desktop-app', name: 'Desktop App', desc: 'Convert any website to Windows desktop app (EXE). Run websites as native desktop applications.' },
];

// Static pages (non-convert)
const staticPages = [
  { path: 'about', title: 'About WebToApp — Website to App Converter', desc: 'Learn about WebToApp, the easiest way to convert any website to an Android app. No coding required.' },
  { path: 'docs', title: 'Documentation — WebToApp Developer Guide', desc: 'WebToApp documentation. Learn how to convert websites to Android apps, customize settings, and publish to Google Play.' },
  { path: 'showcase', title: 'Showcase — Apps Built with WebToApp', desc: 'See real Android apps built with WebToApp. Examples of websites converted to mobile apps.' },
  { path: 'tutorials', title: 'Tutorials — WebToApp Step-by-Step Guides', desc: 'Step-by-step tutorials for converting websites to Android apps. WordPress, Shopify, React, and more.' },
  { path: 'blog', title: 'Blog — WebToApp Tips & Guides', desc: 'WebToApp blog. Tutorials, tips, and guides for converting websites to mobile apps.' },
  { path: 'features', title: 'Features — WebToApp Website to App Converter', desc: 'WebToApp features: push notifications, offline mode, AdMob monetization, custom icons, splash screens, and more.' },
  { path: 'pricing', title: 'Pricing — WebToApp Plans & Pricing', desc: 'WebToApp pricing. Free plan available. Premium plans for custom branding, push notifications, and Play Store publishing.' },
  { path: 'contact', title: 'Contact — WebToApp Support', desc: 'Contact WebToApp support team. Get help with website to app conversion.' },
];

let generated = 0;

// Generate /convert/* pages
for (const p of platforms) {
  const slug = `${p.slug}-to-app`;
  const dir = path.join(distDir, 'convert', slug);
  fs.mkdirSync(dir, { recursive: true });

  const title = `Convert ${p.name} Website to Android App — No Coding | WebToApp`;
  const desc = p.desc;
  const canonical = `https://websitetoapp.app/convert/${slug}`;
  const keyword = `convert ${p.name.toLowerCase()} to app, ${p.name.toLowerCase()} to android app, ${p.name.toLowerCase()} website to apk`;

  // Inject SEO content into the HTML
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="title"[^>]*>/, `<meta name="title" content="${title}" />`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}" />`)
    .replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${keyword}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="twitter:title"[^>]*>/, `<meta property="twitter:title" content="${title}" />`)
    .replace(/<meta property="twitter:description"[^>]*>/, `<meta property="twitter:description" content="${desc}" />`)
    .replace(/<meta property="twitter:url"[^>]*>/, `<meta property="twitter:url" content="${canonical}" />`);

  // Add canonical link + pre-rendered content for Googlebot (before <div id="root">)
  const seoContent = `
    <link rel="canonical" href="${canonical}" />
    <!--seo-prerender-->
    <div id="seo-prerender" style="position:absolute;left:-9999px">
      <h1>Convert ${p.name} Website to Android App</h1>
      <p>${desc} No coding required. Get your app ready for Google Play in minutes.</p>
      <p>WebToApp converts any ${p.name} website into a native Android app (APK) with push notifications, offline mode, and custom branding.</p>
      <a href="https://websitetoapp.app/register">Convert Your ${p.name} Site Now</a>
    </div>
    <!--/seo-prerender-->`;

  html = html.replace('<div id="root">', seoContent + '\n    <div id="root">');

  fs.writeFileSync(path.join(dir, 'index.html'), html);
  generated++;
}

// Generate static pages
for (const p of staticPages) {
  const dir = path.join(distDir, p.path);
  fs.mkdirSync(dir, { recursive: true });

  const canonical = `https://websitetoapp.app/${p.path}`;

  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${p.title}</title>`)
    .replace(/<meta name="title"[^>]*>/, `<meta name="title" content="${p.title}" />`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${p.desc}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${p.title}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${p.desc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="twitter:title"[^>]*>/, `<meta property="twitter:title" content="${p.title}" />`)
    .replace(/<meta property="twitter:description"[^>]*>/, `<meta property="twitter:description" content="${p.desc}" />`);

  html = html.replace('<div id="root">', `<link rel="canonical" href="${canonical}" />\n    <div id="root">`);

  // Don't overwrite if file already exists (e.g., privacy-policy.html)
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, html);
    generated++;
  }
}

console.log(`Generated ${generated} static HTML pages for SEO`);
