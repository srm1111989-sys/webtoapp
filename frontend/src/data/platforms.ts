export interface Platform {
  slug: string
  name: string
  displayName: string
  description: string
  icon?: string
  features: string[]
  benefits: string[]
  targetKeyword: string
  monthlySearches: number
  faqs: Array<{
    question: string
    answer: string
  }>
}

export const platforms: Platform[] = [
  {
    slug: 'wordpress',
    name: 'WordPress',
    displayName: 'WordPress',
    description: 'Convert your WordPress website to Android and iOS app in minutes',
    icon: '/icons/wordpress.svg',
    targetKeyword: 'wordpress to app',
    monthlySearches: 2900,
    features: [
      'Automatic blog post sync',
      'WooCommerce full support',
      'WordPress comments integration',
      'Multi-author support',
      'Category and tag filtering',
      'SEO optimization carried over',
      'WordPress REST API integration',
      'Plugin compatibility check'
    ],
    benefits: [
      'Push notifications for new blog posts',
      'Faster mobile performance than WordPress mobile',
      'Offline reading mode for articles',
      'Native shopping experience for WooCommerce',
      'Better engagement than mobile web',
      'App Store and Google Play presence'
    ],
    faqs: [
      {
        question: 'How do I convert my WordPress site to an Android app?',
        answer: 'Use WebsiteToApp.app to convert your WordPress site in 3 steps: 1) Enter your WordPress URL, 2) Customize app design and features, 3) Build and download your app. Takes about 10 minutes and requires no coding.'
      },
      {
        question: 'Will my WooCommerce store work in the app?',
        answer: 'Yes! WooCommerce is fully supported. All features work including product variants, shopping cart, checkout, and payment gateways like Stripe and PayPal.'
      },
      {
        question: 'Do WordPress plugins work in the app?',
        answer: 'Most WordPress plugins work seamlessly. Contact forms, email marketing, analytics, and WooCommerce plugins are fully compatible. Page builders may have slight styling differences.'
      },
      {
        question: 'How do I send push notifications for new WordPress posts?',
        answer: 'Install our free WordPress plugin that automatically sends push notifications when you publish new posts. You can customize the notification title and message.'
      },
      {
        question: 'Can I update my app content?',
        answer: 'Content updates automatically! When you publish new posts or update pages in WordPress, they instantly appear in your app. No need to rebuild or update the app.'
      },
      {
        question: 'How much does it cost to convert WordPress to app?',
        answer: 'Starting at free for basic features, or $35 one-time payment for full features including push notifications, offline mode, and AAB file for Google Play Store.'
      }
    ]
  },
  {
    slug: 'shopify',
    name: 'Shopify',
    displayName: 'Shopify',
    description: 'Turn your Shopify store into a mobile app and boost sales by 300%',
    icon: '/icons/shopify.svg',
    targetKeyword: 'shopify to app',
    monthlySearches: 1600,
    features: [
      'Full shopping cart functionality',
      'Secure Shopify checkout',
      'Product variants support',
      'Inventory sync',
      'Order tracking',
      'Customer account integration',
      'Abandoned cart recovery',
      'Multi-currency support'
    ],
    benefits: [
      '3x higher conversion rate than mobile web',
      'Push notifications for abandoned carts',
      'Faster checkout process',
      'Better mobile shopping experience',
      'App-exclusive deals and discounts',
      'Increased customer lifetime value'
    ],
    faqs: [
      {
        question: 'How do I convert my Shopify store to a mobile app?',
        answer: 'Visit WebsiteToApp.app, enter your Shopify store URL, customize your app design, enable features like push notifications, and build your app. The entire process takes about 15 minutes.'
      },
      {
        question: 'Will Shopify checkout work in the app?',
        answer: 'Yes! Shopify\'s secure checkout works perfectly in the app. All payment methods including Shop Pay, credit cards, PayPal, and Apple Pay are fully supported.'
      },
      {
        question: 'Can I send abandoned cart notifications?',
        answer: 'Yes! Set up automated push notifications that remind customers about items left in their cart. This typically recovers 15-20% of abandoned carts.'
      },
      {
        question: 'How do product variants work in the app?',
        answer: 'Product variants (size, color, style) work exactly as they do on your Shopify store. Customers can select options, see variant-specific images, and prices update automatically.'
      },
      {
        question: 'Do I need both an app and my Shopify store?',
        answer: 'Yes, the app loads your Shopify store content. Your Shopify store remains the backend, and the app provides a better mobile shopping experience for customers.'
      },
      {
        question: 'How much revenue can I expect from the app?',
        answer: 'On average, Shopify stores see 25-45% of their revenue come from the app within 3 months. Apps have 3x higher conversion rates than mobile websites.'
      }
    ]
  },
  {
    slug: 'wix',
    name: 'Wix',
    displayName: 'Wix',
    description: 'Convert your Wix website to Android and iOS mobile app',
    icon: '/icons/wix.svg',
    targetKeyword: 'wix to app',
    monthlySearches: 1300,
    features: [
      'Wix website full compatibility',
      'Wix Stores support',
      'Wix Blog integration',
      'Contact forms preserved',
      'Image galleries supported',
      'Wix Bookings compatible',
      'Custom design maintained'
    ],
    benefits: [
      'Faster than Wix mobile site',
      'Push notifications for updates',
      'Offline browsing capability',
      'Better mobile user experience',
      'App Store presence',
      'Direct marketing channel'
    ],
    faqs: [
      {
        question: 'Can I convert my Wix website to an app?',
        answer: 'Yes! WebsiteToApp.app supports Wix websites. Simply enter your Wix site URL and our system will convert it to a mobile app in minutes.'
      },
      {
        question: 'Will my Wix Store work in the app?',
        answer: 'Yes, Wix Stores functionality works in the app. Customers can browse products, add to cart, and complete checkout using Wix\'s secure payment system.'
      },
      {
        question: 'Do Wix apps and widgets work?',
        answer: 'Most Wix apps and widgets are compatible. Forms, galleries, social feeds, and booking systems work well. Some complex widgets may require testing.'
      },
      {
        question: 'How long does it take to convert Wix to app?',
        answer: 'The conversion process takes about 10-15 minutes from entering your URL to downloading your app. Building the app itself takes 5-10 minutes automatically.'
      }
    ]
  },
  {
    slug: 'squarespace',
    name: 'Squarespace',
    displayName: 'Squarespace',
    description: 'Transform your Squarespace website into a professional mobile app',
    icon: '/icons/squarespace.svg',
    targetKeyword: 'squarespace to app',
    monthlySearches: 880,
    features: [
      'Squarespace Commerce support',
      'Blog post synchronization',
      'Portfolio galleries',
      'Form submissions',
      'Member areas',
      'Event listings',
      'Newsletter integration'
    ],
    benefits: [
      'Professional mobile presence',
      'Push notifications capability',
      'Enhanced mobile commerce',
      'Better customer engagement',
      'Faster performance',
      'Offline content access'
    ],
    faqs: [
      {
        question: 'How do I turn my Squarespace site into an app?',
        answer: 'Use WebsiteToApp.app: enter your Squarespace URL, customize the app appearance, enable desired features, and build. The process is quick and requires no coding skills.'
      },
      {
        question: 'Will Squarespace Commerce work in the app?',
        answer: 'Yes! Squarespace Commerce features including product pages, shopping cart, and checkout work seamlessly in the converted app.'
      },
      {
        question: 'Can I use custom domains with my Squarespace app?',
        answer: 'Yes, if your Squarespace site uses a custom domain, that domain will work perfectly in your app.'
      },
      {
        question: 'How much does it cost?',
        answer: 'Starting at $35 one-time payment for a Squarespace app with full features, or try the free plan to test basic functionality first.'
      }
    ]
  },
  {
    slug: 'webflow',
    name: 'Webflow',
    displayName: 'Webflow',
    description: 'Convert your Webflow website to a native mobile app',
    icon: '/icons/webflow.svg',
    targetKeyword: 'webflow to app',
    monthlySearches: 480,
    features: [
      'Webflow CMS integration',
      'E-commerce functionality',
      'Responsive design preserved',
      'Form submissions',
      'CMS collections sync',
      'Custom interactions',
      'Dynamic content'
    ],
    benefits: [
      'Native app performance',
      'Push notifications for CMS updates',
      'Offline content caching',
      'Better mobile UX',
      'App store visibility',
      'Direct user engagement'
    ],
    faqs: [
      {
        question: 'Can I convert my Webflow site to an app?',
        answer: 'Absolutely! WebsiteToApp.app fully supports Webflow websites. Your site\'s design and functionality will be preserved in the app.'
      },
      {
        question: 'Will Webflow CMS work in the app?',
        answer: 'Yes, Webflow CMS content automatically appears in your app. When you update CMS items in Webflow, they instantly update in the app.'
      },
      {
        question: 'Do Webflow interactions work?',
        answer: 'Most Webflow interactions and animations work in the app. Complex custom code may require testing to ensure compatibility.'
      }
    ]
  },
  {
    slug: 'weebly',
    name: 'Weebly',
    displayName: 'Weebly',
    description: 'Turn your Weebly website into an Android and iOS app',
    icon: '/icons/weebly.svg',
    targetKeyword: 'weebly to app',
    monthlySearches: 390,
    features: [
      'Weebly store support',
      'Blog integration',
      'Contact forms',
      'Image galleries',
      'E-commerce features',
      'Member login'
    ],
    benefits: [
      'Better mobile performance',
      'Push notifications',
      'Offline browsing',
      'Enhanced shopping experience',
      'App store distribution',
      'Customer retention'
    ],
    faqs: [
      {
        question: 'How do I convert Weebly to an app?',
        answer: 'Go to WebsiteToApp.app, input your Weebly site URL, customize your app\'s look, select features, and build. It takes about 10 minutes total.'
      },
      {
        question: 'Will my Weebly store work?',
        answer: 'Yes! Weebly eCommerce functionality is fully supported in the app, including products, cart, and checkout.'
      }
    ]
  }
]
