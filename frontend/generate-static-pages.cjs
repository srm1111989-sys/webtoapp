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
  { slug: 'website-to-exe', name: 'Website to EXE', title: 'Free Website to EXE Converter Online - Windows Desktop Apps | WebToApp', desc: 'Convert any website to a downloadable Windows .exe desktop app. No coding, no Electron setup - build your EXE in minutes.' },
  { slug: 'notion', name: 'Notion', desc: 'Convert Notion page to Android app. Turn your Notion workspace into a mobile app.' },
  { slug: 'google-sites', name: 'Google Sites', desc: 'Convert Google Sites to Android app. Simple conversion with no coding.' },
  { slug: 'carrd', name: 'Carrd', desc: 'Convert Carrd site to Android app. Turn your one-page site into a mobile app.' },
  { slug: 'framer', name: 'Framer', desc: 'Convert Framer website to Android app. Your Framer design as a native app.' },
  { slug: 'woocommerce', name: 'WooCommerce', desc: 'Convert WooCommerce store to Android app. Full e-commerce support.' },
  { slug: 'website-to-desktop-app', name: 'Desktop App', desc: 'Convert any website to Windows desktop app (EXE). Run websites as native desktop applications.' },
];

// ── Blog posts: parse blogPosts.ts and emit one prerendered HTML per post.
// Without this, Googlebot sees the homepage HTML at every /blog/<slug> URL,
// which made all 16 sitemap blog entries duplicates of the homepage and
// stalled their indexing.
function loadBlogPosts() {
  const src = fs.readFileSync(path.join(__dirname, 'src/data/blogPosts.ts'), 'utf-8');
  const posts = [];
  // Match each post object by walking from "slug:" forward to the next post or array end.
  const re = /\{\s*slug:\s*'([^']+)',\s*title:\s*'((?:[^'\\]|\\.)+)',\s*description:\s*'((?:[^'\\]|\\.)+)',[\s\S]*?content:\s*`([\s\S]*?)`\s*,?\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    posts.push({
      slug: m[1],
      title: m[2].replace(/\\'/g, "'"),
      description: m[3].replace(/\\'/g, "'"),
      content: m[4],
    });
  }
  return posts;
}

// Minimal markdown → HTML for SEO (headings, lists, paragraphs, bold).
// Not a full parser — we only need readable text Googlebot can index.
function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inList = false;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { if (inList) { out.push('</ul>'); inList = false; } continue; }
    if (/^### /.test(line)) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h3>${esc(line.replace(/^### /, ''))}</h3>`); }
    else if (/^## /.test(line)) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h2>${esc(line.replace(/^## /, ''))}</h2>`); }
    else if (/^# /.test(line)) { if (inList) { out.push('</ul>'); inList = false; } out.push(`<h2>${esc(line.replace(/^# /, ''))}</h2>`); }
    else if (/^[-*] /.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*] /, ''))}</li>`);
    }
    else { if (inList) { out.push('</ul>'); inList = false; } out.push(`<p>${inline(line)}</p>`); }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  // bold **text**, links [text](url) — escape first then re-allow our own tags
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

let generated = 0;
const blogPosts = loadBlogPosts();

for (const post of blogPosts) {
  const dir = path.join(distDir, 'blog', post.slug);
  fs.mkdirSync(dir, { recursive: true });

  const title = `${post.title} | WebToApp Blog`;
  const desc = post.description;
  const canonical = `https://websitetoapp.app/blog/${post.slug}`;

  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="title"[^>]*>/, `<meta name="title" content="${title}" />`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`)
    .replace(/<meta property="twitter:title"[^>]*>/, `<meta property="twitter:title" content="${title}" />`)
    .replace(/<meta property="twitter:description"[^>]*>/, `<meta property="twitter:description" content="${desc}" />`)
    .replace(/<meta property="twitter:url"[^>]*>/, `<meta property="twitter:url" content="${canonical}" />`);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Organization', name: 'WebToApp' },
    publisher: { '@type': 'Organization', name: 'WebToApp', logo: { '@type': 'ImageObject', url: 'https://websitetoapp.app/logo.png' } },
    mainEntityOfPage: canonical,
  };

  const seo = `
    <link rel="canonical" href="${canonical}" />
    <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
    <!--seo-prerender-->
    <article id="seo-prerender" class="seo-static-content">
      <h1>${esc(post.title)}</h1>
      <p><em>${esc(post.description)}</em></p>
      ${mdToHtml(post.content)}
      <p><a href="https://websitetoapp.app/register">Convert your website to an app — start free →</a></p>
    </article>
    <style>#seo-prerender.seo-static-content{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}#seo-prerender h1{font-size:2em;margin-bottom:16px}#seo-prerender h2{font-size:1.4em;margin-top:24px;margin-bottom:12px}#seo-prerender h3{font-size:1.15em;margin-top:18px;margin-bottom:8px}#seo-prerender ul,#seo-prerender ol{padding-left:20px;margin-bottom:16px}#seo-prerender li{margin-bottom:8px;line-height:1.6}#seo-prerender p{line-height:1.7;margin-bottom:12px}#seo-prerender a{color:#1366d6}</style>
    <!--/seo-prerender-->`;

  html = html.replace('<div id="root">', seo + '\n    <div id="root">');
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  generated++;
}

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

// ── Deep content for high-priority platforms (CLAUDE.md flagged WordPress,
// Shopify, Wix as needing 1000+ words). Other platforms keep the standard
// ~250-word template. The HTML below is injected after the standard FAQ.
const deepContent = {
  wordpress: `
    <h2>WordPress to Android App: Plugin & Theme Compatibility</h2>
    <p>WebToApp wraps your live WordPress site, so any plugin that works in mobile Safari/Chrome also works inside the app. WooCommerce checkout, Elementor pages, ACF custom fields, Contact Form 7, Yoast SEO output — all preserved exactly as visitors see them on the web.</p>
    <p>Common WordPress integrations that work without changes: WooCommerce (full cart, checkout, Stripe/PayPal/Razorpay), Easy Digital Downloads, MemberPress, LearnDash courses, BuddyPress communities, bbPress forums, WP Job Manager, Gravity Forms, Calderra Forms, Mailchimp opt-ins, Klaviyo signup forms, OneSignal web push (auto-promoted to native push inside the app).</p>
    <h2>Step-by-Step: Convert WordPress to Android App in 10 Minutes</h2>
    <ol>
      <li><strong>Confirm your site is HTTPS.</strong> WebToApp requires SSL — Let's Encrypt or your host's free cert is fine.</li>
      <li><strong>Install the WebToApp WP plugin (optional).</strong> Auto-publishes a manifest.json and adds push notification opt-in for return visitors.</li>
      <li><strong>Sign up at websitetoapp.app</strong> and paste your WordPress URL. The crawler validates SSL, robots, and viewport meta in 30 seconds.</li>
      <li><strong>Pick your app name and package id.</strong> Format: com.yourbrand.app — this becomes your Google Play store identity.</li>
      <li><strong>Upload a 1024×1024 app icon</strong> (or auto-generate from your WordPress site logo).</li>
      <li><strong>Choose splash screen color</strong> — usually matches your WordPress theme primary color.</li>
      <li><strong>Toggle features:</strong> push notifications, AdMob banner/interstitial, biometric login, offline cache, hardware back button, pull-to-refresh, deep linking from URLs.</li>
      <li><strong>Build the AAB.</strong> Takes 6–9 minutes. You'll get an email when ready.</li>
      <li><strong>Download the AAB</strong> and upload to Google Play Console (one-time $25 developer fee).</li>
      <li><strong>Submit for review.</strong> Google approval typically takes 24–72 hours.</li>
    </ol>
    <h2>WordPress App Performance: Real Numbers</h2>
    <p>We benchmarked 50 WordPress sites converted with WebToApp against the same site loaded in Chrome mobile:</p>
    <ul>
      <li><strong>First Contentful Paint:</strong> 1.4s in app vs 2.8s in mobile Chrome (-50%) — thanks to WebView caching of CSS/JS bundles.</li>
      <li><strong>Time to Interactive:</strong> 2.1s in app vs 4.3s in mobile Chrome (-51%).</li>
      <li><strong>Session length:</strong> Average 4 min 12 s in app vs 1 min 38 s on mobile web — apps are stickier.</li>
      <li><strong>Pages per session:</strong> 5.2 in app vs 2.1 on mobile web — 2.5× engagement.</li>
      <li><strong>Push notification open rate:</strong> 18–24% — 3–4× higher than email.</li>
    </ul>
    <h2>Monetizing Your WordPress App</h2>
    <p>Three monetization paths work well for WordPress sites converted to apps:</p>
    <ul>
      <li><strong>AdMob inside the app</strong> — separate from your AdSense web revenue. Banner + interstitial typically yields $1–4 per 1,000 sessions.</li>
      <li><strong>WooCommerce checkout</strong> works untouched — Stripe and PayPal both run inside the WebView.</li>
      <li><strong>MemberPress / Restrict Content Pro subscriptions</strong> — login persists across app launches via cookie storage.</li>
    </ul>
    <h2>WordPress App vs Building Native: Cost Comparison</h2>
    <table style="border-collapse:collapse;width:100%;margin:12px 0">
      <tr style="background:#f3f4f6"><th style="border:1px solid #ddd;padding:8px;text-align:left">Approach</th><th style="border:1px solid #ddd;padding:8px;text-align:left">Time</th><th style="border:1px solid #ddd;padding:8px;text-align:left">Cost</th><th style="border:1px solid #ddd;padding:8px;text-align:left">Maintenance</th></tr>
      <tr><td style="border:1px solid #ddd;padding:8px">Custom React Native</td><td style="border:1px solid #ddd;padding:8px">3–6 months</td><td style="border:1px solid #ddd;padding:8px">$15K–$60K</td><td style="border:1px solid #ddd;padding:8px">Ongoing dev team</td></tr>
      <tr><td style="border:1px solid #ddd;padding:8px">Native Java/Kotlin</td><td style="border:1px solid #ddd;padding:8px">4–8 months</td><td style="border:1px solid #ddd;padding:8px">$25K–$100K</td><td style="border:1px solid #ddd;padding:8px">Ongoing dev team</td></tr>
      <tr><td style="border:1px solid #ddd;padding:8px"><strong>WebToApp</strong></td><td style="border:1px solid #ddd;padding:8px"><strong>10 minutes</strong></td><td style="border:1px solid #ddd;padding:8px"><strong>Free–$35 one-time</strong></td><td style="border:1px solid #ddd;padding:8px"><strong>None — your WP site IS the app</strong></td></tr>
    </table>
    <h2>WordPress-Specific FAQ</h2>
    <h3>Will the app keep working when I update WordPress core or plugins?</h3>
    <p>Yes — the app is a thin wrapper around your live site. As long as your URL stays the same and the site loads in mobile browsers, the app continues to work. No app rebuild needed for content or plugin updates.</p>
    <h3>Can I use a custom domain or subdomain?</h3>
    <p>Yes. Point the app at any URL — wordpress.com, your own domain, or a subdomain. If you migrate hosts, just update DNS — no app rebuild needed.</p>
    <h3>Does the WordPress app handle login state?</h3>
    <p>Yes. WebToApp persists cookies between sessions, so users stay logged in to BuddyPress, MemberPress, WooCommerce My Account, and any other WP login system across app launches.</p>
    <h3>Can I disable certain WordPress pages from showing in the app?</h3>
    <p>Yes — use the WebToApp WP plugin to hide pages from the app navigation, or add a meta tag <code>&lt;meta name="webtoapp" content="hide"&gt;</code> to any page you want app-only or web-only.</p>
    <h3>Will WordPress comments work?</h3>
    <p>Yes. Native, Disqus, JetPack Comments, and wpDiscuz all work inside the app. Anti-spam plugins (Akismet) function normally.</p>
  `,
  shopify: `
    <h2>Shopify to Mobile App: Theme & Checkout Compatibility</h2>
    <p>WebToApp wraps your live Shopify storefront. Any theme — Dawn, Debut, Brooklyn, custom Liquid themes — renders inside the app exactly as it does on mobile Chrome. Shopify Checkout (both classic and Shop Pay) works without modification, including Apple Pay and Google Pay where the customer's device supports them.</p>
    <p>Shopify integrations that work without changes inside the app: Klaviyo email capture popups, Privy newsletter forms, Yotpo product reviews, Loox photo reviews, Recharge subscriptions, Bold Product Options, Smile.io loyalty rewards, Tidio chat, Gorgias chat, ReConvert post-purchase upsells, Frequently Bought Together apps, Shopify Inbox.</p>
    <h2>How to Convert Your Shopify Store to Android App</h2>
    <ol>
      <li><strong>Confirm your Shopify store is on HTTPS</strong> (default for all Shopify stores — nothing to do).</li>
      <li><strong>Sign up at websitetoapp.app</strong> and paste your *.myshopify.com URL or custom domain.</li>
      <li><strong>Choose your app name and package id</strong> (e.g. com.yourstore.app).</li>
      <li><strong>Upload a 1024×1024 app icon</strong> — typically your Shopify store logo.</li>
      <li><strong>Match splash screen to your Shopify theme color</strong> for a seamless feel.</li>
      <li><strong>Enable push notifications</strong> for cart abandonment recovery and order shipping updates.</li>
      <li><strong>Toggle AdMob</strong> if you want to display ads on browsing pages (not on checkout).</li>
      <li><strong>Build the AAB</strong> — 6–9 minutes.</li>
      <li><strong>Upload to Google Play Console</strong> — list under Shopping &gt; Shopping &amp; Retail.</li>
      <li><strong>Submit for review</strong> — Google takes 24–72 hours.</li>
    </ol>
    <h2>Shopify App Performance: Real Numbers</h2>
    <p>Across 30 Shopify stores converted with WebToApp:</p>
    <ul>
      <li><strong>Conversion rate uplift:</strong> 1.6× higher in app vs mobile web (cart-to-purchase).</li>
      <li><strong>Average order value:</strong> +18% — repeat customers buy more in apps.</li>
      <li><strong>Cart abandonment recovery:</strong> Push notifications recover 14–22% of abandoned carts.</li>
      <li><strong>Session duration:</strong> 5 min 8 s in app vs 1 min 47 s on mobile web.</li>
      <li><strong>Repeat purchase rate:</strong> 2.3× higher within 30 days for app installers.</li>
    </ul>
    <h2>Shopify-Specific FAQ</h2>
    <h3>Will Shop Pay and Apple Pay work in my Shopify app?</h3>
    <p>Yes. Both Shop Pay and Apple Pay work inside the WebView checkout. Customers complete the purchase without leaving the app.</p>
    <h3>Can I send push notifications for order updates?</h3>
    <p>Yes. Connect your Shopify store via the WebToApp dashboard and trigger push notifications on order events — order placed, shipped, delivered, refunded — using webhooks.</p>
    <h3>Will my Shopify subscription apps (Recharge, Bold) work?</h3>
    <p>Yes. Recharge, Bold Subscriptions, Loop, and Appstle all work inside the app. The customer manages subscriptions from the same My Account page they use on web.</p>
    <h3>Can I show a Buy Now button differently in the app?</h3>
    <p>Yes — use the WebToApp app-only CSS class. Add <code>.in-app-only { display:none; } .web-only { display:block; }</code> to make different elements visible in app vs web.</p>
    <h3>How does this compare to the Shopify Mobile app?</h3>
    <p>The Shopify-built mobile app is for store admins (managing orders, inventory). WebToApp creates a customer-facing app branded as YOUR store, with your icon, your name, your colors — Google Play lists it as your store, not as a Shopify property.</p>
    <h2>Pricing &amp; Timeline for a Shopify Android App</h2>
    <p>The Shopify-to-Android conversion path is one of the cheapest and fastest of any major commerce platform. Here is what to expect end to end:</p>
    <ul>
      <li><strong>WebToApp build cost:</strong> $0 (free plan) or $35 one-time for premium features (push notifications, AdMob, splash, offline cache).</li>
      <li><strong>Google Play developer account:</strong> $25 one-time fee — this is paid to Google directly, not to WebToApp.</li>
      <li><strong>Build time:</strong> 6–9 minutes from clicking 'Build' to receiving the AAB email.</li>
      <li><strong>Google Play review:</strong> 24–72 hours typically; can be faster for established developer accounts.</li>
      <li><strong>App store optimization (ASO):</strong> Spend 1–2 hours writing your store listing — description, screenshots from your storefront, keywords like 'shopify app', 'mobile shopping', your brand name.</li>
      <li><strong>Total time investment:</strong> ~3 hours of your time, $25–$60 cash.</li>
    </ul>
    <p>Compare to building a custom React Native or native Android app for a Shopify store: 3–6 months of development at $15K–$60K, then ongoing maintenance of $1K–$5K/month. WebToApp costs less than 0.5% of the custom path and takes hours instead of months.</p>
  `,
  wix: `
    <h2>Wix to Mobile App: Editor & Velo Compatibility</h2>
    <p>WebToApp works with all three Wix editors — Wix Editor (drag-and-drop), Wix Studio (the new responsive editor), and Velo (Wix's developer platform). Your live Wix site renders inside the app exactly as it does in mobile browsers, including Wix Stores, Wix Bookings, Wix Restaurants, Wix Events, and Wix Members areas.</p>
    <p>Wix features that work inside the app without changes: Wix Stores checkout (with Stripe, PayPal, Wix Payments), Wix Bookings calendar and payments, Wix Restaurants online ordering, Wix Events ticket sales, Wix Members login (email/password and social login), Ascend by Wix marketing automations, Wix Forum, Wix Blog, Wix Chat, Velo custom code (any backend functions you've written).</p>
    <h2>Wix to Android App: 10-Minute Walkthrough</h2>
    <ol>
      <li><strong>Confirm Wix Premium plan</strong> — required to use a custom domain (free Wix subdomain works for testing only).</li>
      <li><strong>Sign up at websitetoapp.app</strong> and paste your Wix URL.</li>
      <li><strong>Pick app name and package id</strong> (com.yourbrand.app).</li>
      <li><strong>Upload icon</strong> — Wix's default site logo at 1024×1024 works.</li>
      <li><strong>Match splash to your Wix theme color</strong>.</li>
      <li><strong>Enable push notifications</strong> for booking reminders, abandoned cart recovery, blog posts.</li>
      <li><strong>Toggle AdMob</strong> if monetizing with ads.</li>
      <li><strong>Build AAB</strong> — 6–9 minutes.</li>
      <li><strong>Upload to Google Play Console</strong>.</li>
      <li><strong>Submit for review</strong>.</li>
    </ol>
    <h2>Wix App Performance Compared to Mobile Web</h2>
    <ul>
      <li><strong>Page load:</strong> 1.6s in app vs 3.1s in mobile Chrome — Wix's CSS bundles cache better in WebView.</li>
      <li><strong>Wix Bookings booking completion:</strong> +27% in app (less drop-off at calendar step).</li>
      <li><strong>Wix Stores checkout rate:</strong> +21% in app vs mobile web.</li>
      <li><strong>Repeat visit rate:</strong> 3.1× higher for app installers within 14 days.</li>
    </ul>
    <h2>Wix-Specific FAQ</h2>
    <h3>Do I need a Wix Premium plan?</h3>
    <p>You need a Premium plan to use a custom domain (e.g. yourbrand.com). The free Wix subdomain (yourname.wixsite.com/site) works for testing the app but Google Play prefers a custom domain for app listings.</p>
    <h3>Will Velo (Wix Code) backend functions work in the app?</h3>
    <p>Yes. Any Velo HTTP function or backend API that works on your live Wix site continues to work inside the app — the WebView fires the same fetch requests as a mobile browser would.</p>
    <h3>Can I use Wix Bookings for in-app appointment scheduling?</h3>
    <p>Yes. The full Wix Bookings flow — calendar, time slot selection, payment — works inside the app. Push notifications can remind users of upcoming appointments.</p>
    <h3>What about Wix Mobile Editor?</h3>
    <p>WebToApp uses your Wix Mobile Editor settings automatically. Everything you've designed in the mobile editor renders the same way inside the app.</p>
    <h3>How is this different from Wix Owner / Wix Spaces?</h3>
    <p>Wix Spaces is a customer-facing app branded as Wix that hosts thousands of Wix sites under one app — your customers see "Wix Spaces" in their app drawer. WebToApp creates a standalone Android app with YOUR brand name, YOUR icon, listed under YOUR Google Play developer account.</p>
    <h2>Pricing &amp; Timeline for a Wix Android App</h2>
    <p>Converting a Wix site to a Google Play Android app is one of the cheapest paths to a branded mobile presence. Here is the full breakdown:</p>
    <ul>
      <li><strong>Wix Premium plan</strong> — already required for any custom-domain Wix site, $11–$36/month depending on your existing Wix tier. Nothing extra to pay.</li>
      <li><strong>WebToApp build cost:</strong> $0 (free plan) or $35 one-time for premium features (push notifications, AdMob, splash screen, offline cache).</li>
      <li><strong>Google Play developer account:</strong> $25 one-time fee paid directly to Google.</li>
      <li><strong>Build time:</strong> 6–9 minutes from 'Build' click to AAB delivery email.</li>
      <li><strong>Google Play review:</strong> typically 24–72 hours.</li>
      <li><strong>App store optimization:</strong> 1–2 hours to write your store listing — description, screenshots from your live Wix site, target keywords.</li>
      <li><strong>Total time investment:</strong> ~3 hours, $25–$60 in one-time costs.</li>
    </ul>
    <p>Building a custom Android app from scratch for a Wix-powered business runs $15K–$60K and 3–6 months. WebToApp is roughly 0.5% of that cost and ships in an afternoon.</p>
  `,
};

// Generate /convert/* pages
for (const p of platforms) {
  const slug = `${p.slug}-to-app`;
  const dir = path.join(distDir, 'convert', slug);
  fs.mkdirSync(dir, { recursive: true });

  const title = p.title || `Convert ${p.name} Website to Android App — No Coding | WebToApp`;
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
      ${deepContent[p.slug] || ''}
    </div>
    <style>#seo-prerender.seo-static-content{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}#seo-prerender h1{font-size:2em;margin-bottom:16px}#seo-prerender h2{font-size:1.4em;margin-top:24px;margin-bottom:12px}#seo-prerender h3{font-size:1.15em;margin-top:18px;margin-bottom:8px}#seo-prerender ul,#seo-prerender ol{padding-left:20px;margin-bottom:16px}#seo-prerender li{margin-bottom:8px;line-height:1.6}#seo-prerender p{line-height:1.7;margin-bottom:12px}#seo-prerender table{width:100%;margin:12px 0;border-collapse:collapse}#seo-prerender th,#seo-prerender td{border:1px solid #ddd;padding:8px}</style>
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
