export interface CompetitorFeatureRow {
  name: string
  them: string
  us: string
  usBetter: boolean
}

export interface Competitor {
  slug: string
  name: string
  tagline: string
  url: string
  pricing: {
    label: string
    detail: string
    annualCost: string
  }
  pros: string[]
  cons: string[]
  features: CompetitorFeatureRow[]
  verdict: string
  switchReasons: string[]
  seoTitle: string
  seoDescription: string
}

export const competitors: Competitor[] = [
  {
    slug: 'gonative',
    name: 'GoNative',
    tagline: 'GoNative.io Alternative',
    url: 'https://gonative.io',
    pricing: {
      label: '$99–$299/month',
      detail: "GoNative charges $99/month for Android-only (Starter) and $299/month for iOS + Android. That's $1,188–$3,588 per year, every year.",
      annualCost: '$1,188–$3,588/year',
    },
    pros: [
      'iOS app support',
      'Good developer documentation',
      'JavaScript bridge for native features',
      'White-label option for agencies',
    ],
    cons: [
      '$99–$299/month — expensive for small businesses',
      'Stop paying = app stops working',
      'Push notifications require extra setup',
      'Designed for developers, not no-code users',
      'No Windows/Desktop app support',
      'Most powerful features need JavaScript coding',
    ],
    features: [
      { name: 'Android App', them: '✓', us: '✓', usBetter: false },
      { name: 'Windows Desktop App', them: '✗', us: '✓', usBetter: true },
      { name: 'Push Notifications', them: 'Included', us: '✓ Included', usBetter: false },
      { name: 'Biometric Auth', them: 'JS Bridge', us: '✓ No-code', usBetter: true },
      { name: 'AdMob / Monetization', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'QR Scanner', them: 'Plugin required', us: '✓ Included', usBetter: true },
      { name: 'No-code setup', them: 'Dev skills needed', us: '✓ Wizard', usBetter: true },
      { name: 'Pricing model', them: '$99–$299/month', us: '$10 one-time', usBetter: true },
      { name: '1-year total cost', them: '$1,188–$3,588', us: '$10', usBetter: true },
      { name: 'Builds/month', them: '5–unlimited', us: '10', usBetter: false },
      { name: 'Total features', them: '~20', us: '40+', usBetter: true },
    ],
    verdict:
      "GoNative is a capable platform built for developers and agencies, but at $99–$299/month it's simply not affordable for most businesses. WebsiteToApp offers comparable Android conversion with a no-code wizard at a one-time $10 fee — that's the entire annual GoNative cost saved in the first month.",
    switchReasons: [
      'Pay $10 once vs $99–$299 every single month — no renewal ever',
      'Zero coding required — no JavaScript bridge needed',
      '40+ features all included, no extra cost per feature',
      'Windows desktop app included (GoNative has no desktop support)',
      'App stays live forever after one payment — no subscription dependency',
    ],
    seoTitle: 'GoNative Alternative — Same Features, 99% Cheaper',
    seoDescription:
      'GoNative charges $99–$299/month. WebsiteToApp costs $10 one-time with 40+ features and no coding. See the full comparison and switch today.',
  },
  {
    slug: 'webintoapp',
    name: 'WebIntoApp',
    tagline: 'WebIntoApp.com Alternative',
    url: 'https://webintoapp.com',
    pricing: {
      label: 'Free (watermarked) or $89+ one-time',
      detail:
        "WebIntoApp's free plan shows WebIntoApp's own branding and AdMob ads on your app. Removing the watermark and unlocking iOS, AAB, and source code requires the Dedicated plan — from $89 one-time.",
      annualCost: '$89 one-time to remove branding',
    },
    pros: [
      'Free tier exists (but watermarked with WebIntoApp branding)',
      'Simple drag-and-drop interface',
      'Android and basic iOS builds on paid tier',
    ],
    cons: [
      "Free tier shows WebIntoApp's own company name + ads, not yours",
      '$89 one-time just to remove the watermark and unlock iOS/AAB',
      'No Windows desktop app at any price',
      'No biometric auth or offline mode',
      'Only ~15 features total',
      'Community-forum support only',
    ],
    features: [
      { name: 'Android App', them: '✓', us: '✓', usBetter: false },
      { name: 'Windows Desktop App', them: '✗ Not available at any price', us: '✓', usBetter: true },
      { name: 'Push Notifications', them: '✓ (paid tier)', us: '✓ Included', usBetter: false },
      { name: 'No Watermark', them: 'From $89 one-time', us: '$35 one-time', usBetter: true },
      { name: 'Biometric Auth', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'AdMob Integration', them: 'Own account on paid tier only', us: '✓ Included', usBetter: true },
      { name: 'Offline Mode', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'Pricing model', them: 'Free (branded) or $89+ one-time', us: '$35 one-time', usBetter: true },
      { name: 'Branding removal cost', them: '$89 one-time', us: '$35 one-time', usBetter: true },
      { name: 'Total features', them: '~15', us: '40+', usBetter: true },
    ],
    verdict:
      "WebIntoApp's free plan looks tempting, but it ships with WebIntoApp's own name and ads on your app — not yours. Removing that branding costs $89 one-time on the Dedicated plan, and even then you still don't get a desktop/.exe build, biometric auth, or offline mode. WebsiteToApp removes the watermark for $35 one-time — less than a third of WebIntoApp's price — and includes a Windows desktop build, biometric auth, and offline mode WebIntoApp doesn't offer at any tier.",
    switchReasons: [
      '$35 one-time vs $89 one-time to remove branding — less than a third of the price',
      'Windows desktop app / .exe build included (WebIntoApp has no desktop option at any price)',
      'Biometric auth and offline mode included — WebIntoApp offers neither',
      "Your own AdMob ads from the start, not WebIntoApp's ads on your free app",
      'More features in one $35 plan than WebIntoApp\'s most expensive tier',
    ],
    seoTitle: 'WebIntoApp Alternative (2026): Free Plan Watermark Costs $89 to Remove',
    seoDescription:
      "WebIntoApp's \"free\" app shows WebIntoApp's own branding + ads — removing it costs $89 one-time. WebsiteToApp removes the watermark for $35 one-time and adds a desktop .exe build. Compare pricing, features & verdict.",
  },
  {
    slug: 'median',
    name: 'Median.co',
    tagline: 'Median.co Alternative',
    url: 'https://median.co',
    pricing: {
      label: '$99–$299/month',
      detail:
        'Median charges $99/month for Android-only and $299/month for both platforms. Annual billing saves ~20% but still costs $948+ per year.',
      annualCost: '$948–$2,868/year',
    },
    pros: [
      'Strong iOS and Android support',
      'Powerful JavaScript bridge for custom features',
      'Good documentation and community',
      'White-label for agencies',
    ],
    cons: [
      '$99–$299/month subscription',
      'JavaScript bridge requires developer knowledge',
      'Overkill for simple website-to-app conversions',
      'No Windows/Desktop app support',
      'Complex setup for non-technical users',
    ],
    features: [
      { name: 'Android App', them: '✓', us: '✓', usBetter: false },
      { name: 'Windows Desktop App', them: '✗', us: '✓', usBetter: true },
      { name: 'Push Notifications', them: 'JS Bridge needed', us: '✓ No-code', usBetter: true },
      { name: 'Biometric Auth', them: 'JS Bridge needed', us: '✓ No-code', usBetter: true },
      { name: 'AdMob', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'No-code setup', them: 'Dev skills needed', us: '✓ Wizard', usBetter: true },
      { name: 'Pricing model', them: '$99–$299/month', us: '$10 one-time', usBetter: true },
      { name: '1-year total cost', them: '$948–$3,588', us: '$10', usBetter: true },
      { name: 'Total features (no-code)', them: '~10', us: '40+', usBetter: true },
    ],
    verdict:
      "Median is a developer tool that can do impressive things with its JS Bridge — but it charges like an enterprise product and requires coding knowledge for most features. WebsiteToApp delivers the same Android conversion with a zero-code wizard at $10 one-time.",
    switchReasons: [
      '$10 once vs up to $3,588/year — no contest for small businesses',
      'Zero coding required — all 40+ features work without writing a single line of code',
      'Windows desktop app included (Median supports only mobile)',
      'Ready in 5 minutes — not hours of JS Bridge configuration',
      'One payment, app lives forever — no subscription lock-in',
    ],
    seoTitle: 'Median.co Alternative — No Coding, No Monthly Fee',
    seoDescription:
      'Median.co costs $99–$299/month and requires JavaScript coding for features. WebsiteToApp is $10 one-time with no coding needed. Full comparison inside.',
  },
  {
    slug: 'appsgeyser',
    name: 'AppsGeyser',
    tagline: 'AppsGeyser Alternative',
    url: 'https://appsgeyser.com',
    pricing: {
      label: 'Free / $9.99–$199/month',
      detail:
        "AppsGeyser's free plan outputs a branded app with their logo. Removing it costs $9.99–$199/month. Premium features like push notifications cost extra on top.",
      annualCost: '$120+/year to remove branding',
    },
    pros: [
      'Free plan available for testing',
      'Large user base and templates',
      'Simple to start',
    ],
    cons: [
      "Free plan shows AppsGeyser's branding in your app",
      'Monthly subscription just to remove their watermark',
      'No signed AAB for Play Store on free plan',
      'Outdated app output quality',
      'No biometric auth, desktop app, or AdMob',
      'Only ~8 features total',
    ],
    features: [
      { name: 'Android App', them: '✓ (branded)', us: '✓ (no watermark)', usBetter: true },
      { name: 'No Watermark', them: 'Paid only', us: '✓ Always included', usBetter: true },
      { name: 'Signed AAB (Play Store)', them: 'Paid only', us: '✓ Included', usBetter: true },
      { name: 'Push Notifications', them: 'Paid add-on', us: '✓ Included', usBetter: true },
      { name: 'Biometric Auth', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'AdMob / Monetization', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'Windows App', them: '✗', us: '✓', usBetter: true },
      { name: 'Pricing model', them: 'Free + $9.99–$199/mo', us: '$10 one-time', usBetter: true },
      { name: 'Total features', them: '~8', us: '40+', usBetter: true },
    ],
    verdict:
      "AppsGeyser's free plan is misleading — the output is branded with their logo and can't be published to Play Store without a paid subscription. WebsiteToApp's $10 one-time fee gives you a clean, fully-signed APK/AAB with 40+ features — no branding, no monthly bills.",
    switchReasons: [
      'No AppsGeyser watermark or branding — ever, even on the base plan',
      'Signed AAB included from day one — ready for Google Play immediately',
      '40+ features vs AppsGeyser\'s ~8',
      'One $10 payment forever vs monthly subscription just to remove branding',
      'Modern app output with hardware acceleration and proper rendering',
    ],
    seoTitle: 'AppsGeyser Alternative — No Branding, Signed Apps, One Price',
    seoDescription:
      "AppsGeyser puts their branding in your app on the free plan. WebsiteToApp is $10 one-time with no watermark, signed AAB, and 40+ features included.",
  },
  {
    slug: 'appmysite',
    name: 'AppMySite',
    tagline: 'AppMySite Alternative',
    url: 'https://appmysite.com',
    pricing: {
      label: '$19–$49/month',
      detail:
        'AppMySite charges $19/month (Android only) up to $49/month for both platforms with push notifications. That is $228–$588 per year, with key features locked to higher plans.',
      annualCost: '$228–$588/year',
    },
    pros: [
      'Decent WordPress and WooCommerce integration',
      'iOS app support on paid plans',
      'Reasonable UI for non-developers',
      'Real-time content sync with WordPress',
    ],
    cons: [
      '$19–$49/month — ongoing subscription adds up fast',
      'Push notifications only on higher-tier plans',
      'Limited to WordPress/WooCommerce sites on lower plans',
      'No Windows desktop app support',
      'No AdMob monetization included',
      'Biometric auth not available',
    ],
    features: [
      { name: 'Android App', them: '✓ ($19/mo)', us: '✓ ($10 once)', usBetter: true },
      { name: 'Windows Desktop App', them: '✗', us: '✓', usBetter: true },
      { name: 'Push Notifications', them: 'Higher plan only', us: '✓ Included', usBetter: true },
      { name: 'No Watermark', them: '✓', us: '✓', usBetter: false },
      { name: 'Biometric Auth', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'AdMob / Monetization', them: '✗', us: '✓ Included', usBetter: true },
      { name: 'Works with any website', them: 'WordPress only (basic)', us: '✓ Any URL', usBetter: true },
      { name: 'Pricing model', them: '$19–$49/month', us: '$10 one-time', usBetter: true },
      { name: '1-year total cost', them: '$228–$588', us: '$10', usBetter: true },
      { name: 'Total features', them: '~15', us: '40+', usBetter: true },
    ],
    verdict:
      "AppMySite works well for WordPress and WooCommerce sites, but at $19–$49/month you're paying $228–$588 per year — every year. It locks push notifications to premium plans and doesn't support AdMob, biometric auth, or any non-WordPress site. WebsiteToApp works with any website for a single $10 payment with all features included.",
    switchReasons: [
      '$10 once vs $228–$588/year — 20–58× cheaper over one year alone',
      'Works with any website, not just WordPress — React, Shopify, Angular, custom sites',
      'Push notifications, biometric auth, and AdMob all included from day one',
      'Windows desktop app included (AppMySite has no desktop support)',
      'No renewal risk — your app keeps working after one payment forever',
    ],
    seoTitle: 'AppMySite Alternative — Any Website, One Price, More Features',
    seoDescription:
      'AppMySite charges $19–$49/month for WordPress apps. WebsiteToApp is $10 one-time and works with any website. Full feature comparison inside.',
  },
]
