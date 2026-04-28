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
  // Visible to bots, hidden visually after JS hydration via CSS class
  const seoContent = `
    <link rel="canonical" href="${canonical}" />
    <!--seo-prerender-->
    <div id="seo-prerender" class="seo-static-content">
      <h1>Convert ${p.name} Website to Android App — No Coding Required</h1>
      <p>${desc} Turn your ${p.name} site into a fully functional Android app in minutes — no coding, no SDK, no app store experience needed.</p>

      <h2>How to Convert ${p.name} to App in 3 Steps</h2>
      <ol>
        <li><strong>Enter your ${p.name} URL</strong> — paste your website address into WebToApp.</li>
        <li><strong>Customize your app</strong> — set your app name, icon, splash screen, and enable features like push notifications and offline mode.</li>
        <li><strong>Build and download</strong> — get your APK or AAB file ready to publish on Google Play Store.</li>
      </ol>

      <h2>${p.name} App Features</h2>
      <ul>
        <li>Push notifications to re-engage your ${p.name} visitors</li>
        <li>Offline mode — content accessible without internet</li>
        <li>Custom app icon and splash screen matching your ${p.name} brand</li>
        <li>Full ${p.name} functionality preserved — forms, payments, login, all working</li>
        <li>AdMob integration to monetize your ${p.name} app</li>
        <li>Google Play Store ready AAB file with one click</li>
        <li>Hardware back button support on Android</li>
        <li>Custom loading screen and progress bar</li>
      </ul>

      <h2>Why Convert Your ${p.name} Site to a Mobile App?</h2>
      <p>Mobile apps get 3x more engagement than mobile websites. Your ${p.name} visitors who install your app are far more likely to return and convert. Push notifications alone can recover 20-30% of lost visitors.</p>
      <ul>
        <li>Google Play Store presence builds credibility</li>
        <li>Push notifications keep users coming back</li>
        <li>Faster load time than ${p.name} mobile site</li>
        <li>Offline access increases session length</li>
        <li>Native Android feel increases trust</li>
        <li>One APK works on all Android devices</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>How long does it take to convert ${p.name} to an Android app?</h3>
      <p>The conversion takes approximately 10-15 minutes from start to finish. You enter your ${p.name} URL, customize your app settings, and WebToApp builds the APK automatically. No waiting, no queue.</p>

      <h3>Do I need coding skills to convert ${p.name} to app?</h3>
      <p>No coding required. WebToApp handles all the technical work. You only need your ${p.name} website URL and a few minutes to set up your app name, icon, and features.</p>

      <h3>Will my ${p.name} website work properly in the app?</h3>
      <p>Yes. All ${p.name} features work in the app — your existing theme, plugins, forms, login, and checkout all function as expected. WebToApp wraps your site in a native Android shell without modifying any code.</p>

      <h3>Can I publish the app on Google Play Store?</h3>
      <p>Yes. WebToApp generates an AAB (Android App Bundle) file that meets Google Play Store requirements. You can publish directly to Google Play using your developer account.</p>

      <h3>How much does it cost?</h3>
      <p>WebToApp offers a free plan for basic conversion. Premium plans start at $35 one-time payment and include push notifications, offline mode, AdMob monetization, and Google Play AAB file.</p>

      <p><a href="https://websitetoapp.app/register">Start converting your ${p.name} site for free →</a></p>
    </div>
    <style>#seo-prerender.seo-static-content{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}#seo-prerender h1{font-size:2em;margin-bottom:16px}#seo-prerender h2{font-size:1.4em;margin-top:24px;margin-bottom:12px}#seo-prerender ul,#seo-prerender ol{padding-left:20px;margin-bottom:16px}#seo-prerender li{margin-bottom:8px;line-height:1.6}#seo-prerender p{line-height:1.7;margin-bottom:12px}</style>
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
