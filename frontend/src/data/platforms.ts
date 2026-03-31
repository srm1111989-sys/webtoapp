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
  },
  {
    slug: 'blogger',
    name: 'Blogger',
    displayName: 'Blogger',
    description: 'Convert your Blogger blog to a fully functional Android and iOS mobile app',
    icon: '/icons/blogger.svg',
    targetKeyword: 'blogger to app',
    monthlySearches: 720,
    features: [
      'Automatic blog post sync from Blogger',
      'Blogger comment system integration',
      'Label and category filtering',
      'Image and video galleries supported',
      'Google AdSense compatibility',
      'Multiple author support',
      'Blogger API integration',
      'Custom template styling preserved'
    ],
    benefits: [
      'Push notifications for new blog posts',
      'Faster reading experience than mobile web',
      'Offline reading mode for articles',
      'Better reader engagement and retention',
      'App Store and Google Play presence',
      'Monetize with in-app ads'
    ],
    faqs: [
      {
        question: 'How do I convert my Blogger blog to an Android app?',
        answer: 'Visit WebsiteToApp.app, paste your Blogger URL (e.g., yourblog.blogspot.com or custom domain), customize your app design, and build. The whole process takes about 10 minutes with no coding required.'
      },
      {
        question: 'Will my Blogger posts automatically appear in the app?',
        answer: 'Yes! New blog posts are synced automatically. When you publish on Blogger, the content instantly appears in your app without any manual updates.'
      },
      {
        question: 'Does Google AdSense work in the Blogger app?',
        answer: 'Yes, AdSense ads from your Blogger site will display in the app. You can also add AdMob for additional in-app ad revenue.'
      },
      {
        question: 'Can I use my custom domain with the Blogger app?',
        answer: 'Absolutely! Whether you use a blogspot.com address or a custom domain, your Blogger site will work perfectly in the converted app.'
      },
      {
        question: 'How much does it cost to convert Blogger to an app?',
        answer: 'You can start free with basic features, or get the full package for a $35 one-time payment including push notifications, offline mode, and AAB file for Google Play.'
      }
    ]
  },
  {
    slug: 'html-website',
    name: 'HTML Website',
    displayName: 'HTML Website',
    description: 'Convert any static HTML website to a professional Android and iOS mobile app',
    icon: '/icons/html.svg',
    targetKeyword: 'html website to app',
    monthlySearches: 1900,
    features: [
      'Full HTML5 and CSS3 support',
      'JavaScript functionality preserved',
      'Responsive design auto-adaptation',
      'Local file caching for speed',
      'Form submissions work seamlessly',
      'Multimedia content support (audio, video)',
      'Canvas and SVG rendering',
      'External API calls supported'
    ],
    benefits: [
      'Turn any website into a native app',
      'No framework or CMS required',
      'Works with any hosting provider',
      'Push notifications for updates',
      'Offline access to cached pages',
      'Ideal for landing pages and portfolios'
    ],
    faqs: [
      {
        question: 'Can I convert a plain HTML website to an Android app?',
        answer: 'Yes! WebsiteToApp.app works with any HTML website regardless of hosting. Simply enter your website URL and build your app in minutes.'
      },
      {
        question: 'Will my JavaScript code work in the app?',
        answer: 'Yes, JavaScript is fully supported. Interactive elements, AJAX calls, animations, and third-party scripts all work in the converted app.'
      },
      {
        question: 'Do I need to modify my HTML code?',
        answer: 'No modifications needed. Your website is loaded as-is in the app. However, you can optionally inject custom CSS or JavaScript for app-specific customizations.'
      },
      {
        question: 'Will forms and contact pages work?',
        answer: 'Yes! HTML forms, including contact forms, email forms, and any server-side form processing, work exactly as they do on your website.'
      },
      {
        question: 'How do I update the app content?',
        answer: 'Simply update your HTML files on your server. The app loads your website content live, so changes appear immediately without rebuilding the app.'
      }
    ]
  },
  {
    slug: 'react-website',
    name: 'React Website',
    displayName: 'React Website',
    description: 'Convert your React.js web application into a native Android and iOS mobile app',
    icon: '/icons/react.svg',
    targetKeyword: 'react website to app',
    monthlySearches: 880,
    features: [
      'Full React SPA support',
      'React Router navigation preserved',
      'State management compatibility',
      'API calls and data fetching',
      'React component rendering',
      'Client-side routing support',
      'Progressive Web App features',
      'Third-party React library support'
    ],
    benefits: [
      'Ship your React app to app stores',
      'No need to rewrite in React Native',
      'Faster than rebuilding from scratch',
      'Push notifications integration',
      'Access native device features',
      'Reach users through app stores'
    ],
    faqs: [
      {
        question: 'Can I convert my React.js website to a mobile app?',
        answer: 'Yes! WebsiteToApp.app supports React applications including single-page apps (SPAs). Your React components, routing, and state management all work in the converted app.'
      },
      {
        question: 'Is this the same as React Native?',
        answer: 'No. Instead of rewriting your app in React Native, WebsiteToApp wraps your existing React web app in a native container. This is much faster and requires no code changes.'
      },
      {
        question: 'Will React Router work in the app?',
        answer: 'Yes! Client-side routing with React Router (both BrowserRouter and HashRouter) works perfectly. Deep linking is also supported for navigating to specific routes.'
      },
      {
        question: 'Do API calls work from the app?',
        answer: 'Yes, all API calls (fetch, axios, etc.) work exactly as they do in the browser. CORS policies apply the same way, so your existing API integrations are fully compatible.'
      },
      {
        question: 'How long does it take compared to React Native?',
        answer: 'Converting with WebsiteToApp takes 10-15 minutes versus weeks or months to rebuild in React Native. Perfect for MVPs or when you need an app store presence quickly.'
      }
    ]
  },
  {
    slug: 'godaddy',
    name: 'GoDaddy',
    displayName: 'GoDaddy',
    description: 'Convert your GoDaddy website to a professional Android and iOS mobile app',
    icon: '/icons/godaddy.svg',
    targetKeyword: 'godaddy website to app',
    monthlySearches: 590,
    features: [
      'GoDaddy Website Builder compatibility',
      'GoDaddy Online Store support',
      'Appointment booking preserved',
      'Contact forms integration',
      'Photo galleries supported',
      'Social media links maintained',
      'Email marketing integration',
      'GoDaddy Payments support'
    ],
    benefits: [
      'Professional mobile presence for your business',
      'Push notifications to reach customers directly',
      'Faster loading than mobile website',
      'Offline access to key business info',
      'Google Play Store visibility',
      'Increased customer trust with a dedicated app'
    ],
    faqs: [
      {
        question: 'Can I convert my GoDaddy website to a mobile app?',
        answer: 'Yes! WebsiteToApp.app fully supports websites built with GoDaddy Website Builder. Enter your GoDaddy site URL and convert it to an app in minutes.'
      },
      {
        question: 'Will my GoDaddy online store work in the app?',
        answer: 'Yes, GoDaddy Online Store features including product listings, shopping cart, and checkout work seamlessly in the converted app.'
      },
      {
        question: 'Do GoDaddy appointment bookings work?',
        answer: 'Yes! The appointment booking feature from GoDaddy works in your app, allowing customers to schedule appointments directly from the mobile app.'
      },
      {
        question: 'How much does it cost?',
        answer: 'Start free to test, or get the full version for $35 one-time. No monthly subscriptions required, unlike other app builders.'
      }
    ]
  },
  {
    slug: 'restaurant-website',
    name: 'Restaurant Website',
    displayName: 'Restaurant Website',
    description: 'Convert your restaurant website to a mobile app with online ordering, menu display, and reservations',
    icon: '/icons/restaurant.svg',
    targetKeyword: 'restaurant website to app',
    monthlySearches: 720,
    features: [
      'Digital menu display with images',
      'Online ordering integration',
      'Table reservation system',
      'Location and directions with maps',
      'Operating hours and contact info',
      'Photo gallery of dishes and ambiance',
      'Customer reviews integration',
      'Social media links and sharing'
    ],
    benefits: [
      'Push notifications for daily specials and promotions',
      'Increase repeat orders with easy reordering',
      'Reduce third-party delivery app commissions',
      'Build a loyal customer base with your own app',
      'Faster ordering experience for customers',
      'Stand out from competitors without an app'
    ],
    faqs: [
      {
        question: 'How do I convert my restaurant website to a mobile app?',
        answer: 'Visit WebsiteToApp.app, enter your restaurant website URL, customize the app with your branding, and build. Your menu, online ordering, and reservation features are all preserved.'
      },
      {
        question: 'Will online ordering work in the app?',
        answer: 'Yes! If your website supports online ordering (through any platform like Square, Toast, or custom solution), it works seamlessly in the app.'
      },
      {
        question: 'Can I send push notifications for daily specials?',
        answer: 'Absolutely! Send push notifications to announce daily specials, happy hour deals, new menu items, or any promotion to drive more orders.'
      },
      {
        question: 'Do I need a specific website platform?',
        answer: 'No! We support restaurant websites built on any platform — WordPress, Wix, Squarespace, custom HTML, or any other website builder.'
      },
      {
        question: 'How does this compare to UberEats or DoorDash apps?',
        answer: 'Your own app means zero commission fees on orders. You keep 100% of the revenue and build direct customer relationships instead of depending on third-party platforms.'
      }
    ]
  },
  {
    slug: 'church-website',
    name: 'Church Website',
    displayName: 'Church Website',
    description: 'Convert your church website to a mobile app for sermons, events, donations, and community engagement',
    icon: '/icons/church.svg',
    targetKeyword: 'church website to app',
    monthlySearches: 590,
    features: [
      'Sermon audio and video streaming',
      'Event calendar integration',
      'Online donation and tithing',
      'Prayer request submissions',
      'Church bulletin and announcements',
      'Bible reading plans',
      'Small group directories',
      'Volunteer sign-up forms'
    ],
    benefits: [
      'Push notifications for service times and events',
      'Increase member engagement between Sundays',
      'Convenient mobile giving and tithing',
      'Stream sermons to members who can\'t attend',
      'Connect your congregation through one app',
      'Reach younger members who prefer mobile'
    ],
    faqs: [
      {
        question: 'How do I convert my church website to a mobile app?',
        answer: 'Use WebsiteToApp.app to convert your church website in minutes. Enter your URL, customize the app appearance, and build. Sermon pages, event calendars, and donation forms all work in the app.'
      },
      {
        question: 'Will online donations work in the church app?',
        answer: 'Yes! If your website supports online giving (through Tithe.ly, Pushpay, PayPal, or any payment processor), it works perfectly in the app, making it easier for members to give.'
      },
      {
        question: 'Can we stream sermons through the app?',
        answer: 'Yes! Embedded videos from YouTube, Vimeo, or your streaming platform will play directly in the app. Members can watch live or recorded sermons anytime.'
      },
      {
        question: 'How do we notify members about events?',
        answer: 'Use push notifications to instantly notify all app users about upcoming services, special events, prayer meetings, or important announcements.'
      },
      {
        question: 'Is it affordable for a church budget?',
        answer: 'Very affordable! Starting at $35 one-time payment with no monthly fees. Much cheaper than custom church app builders that charge $50-200/month.'
      }
    ]
  },
  {
    slug: 'school-website',
    name: 'School Website',
    displayName: 'School Website',
    description: 'Convert your school website to a mobile app for parents, students, and staff communication',
    icon: '/icons/school.svg',
    targetKeyword: 'school website to app',
    monthlySearches: 480,
    features: [
      'School calendar and events',
      'Announcement and news feed',
      'Parent portal integration',
      'Staff directory with contact info',
      'Lunch menu display',
      'Sports schedules and results',
      'Photo and video galleries',
      'Emergency notification system'
    ],
    benefits: [
      'Instant push notifications for closures and alerts',
      'Parents stay informed with one-tap access',
      'Reduce paper communication costs',
      'Increase parent engagement and involvement',
      'Central hub for all school information',
      'Professional image for your institution'
    ],
    faqs: [
      {
        question: 'How do I convert my school website to a mobile app?',
        answer: 'Visit WebsiteToApp.app, enter your school website URL, customize the design with your school colors and logo, and build the app. Parents and students can then download it from Google Play.'
      },
      {
        question: 'Can we send emergency notifications?',
        answer: 'Yes! Use push notifications for weather closures, lockdowns, early dismissals, or any urgent communication. Notifications reach all parents instantly.'
      },
      {
        question: 'Will the parent portal work in the app?',
        answer: 'Yes! If your school website has a parent portal (PowerSchool, Infinite Campus, or custom), parents can log in and access grades, attendance, and more directly from the app.'
      },
      {
        question: 'Can multiple schools in a district use this?',
        answer: 'Each school can have its own app. Contact us for district-level pricing if you need apps for multiple schools.'
      },
      {
        question: 'Is this COPPA/FERPA compliant?',
        answer: 'The app loads your existing website which already handles compliance. We don\'t collect student data — the app is a secure container for your existing compliant website.'
      }
    ]
  },
  {
    slug: 'gym-website',
    name: 'Gym Website',
    displayName: 'Gym Website',
    description: 'Convert your gym or fitness studio website to a mobile app for class bookings, schedules, and member engagement',
    icon: '/icons/gym.svg',
    targetKeyword: 'gym website to app',
    monthlySearches: 390,
    features: [
      'Class schedule and booking system',
      'Membership management integration',
      'Trainer profiles and availability',
      'Workout plans and tutorials',
      'Check-in functionality',
      'Payment and billing integration',
      'Progress tracking pages',
      'Location and hours display'
    ],
    benefits: [
      'Push notifications for class reminders',
      'Easy class booking from mobile',
      'Reduce no-shows with automated reminders',
      'Increase member retention and engagement',
      'Promote special offers directly to members',
      'Compete with big gym chains that have apps'
    ],
    faqs: [
      {
        question: 'How do I convert my gym website to a mobile app?',
        answer: 'Go to WebsiteToApp.app, enter your gym website URL, customize the app with your branding, and build. Class schedules, booking systems, and member portals all work in the app.'
      },
      {
        question: 'Will class booking work in the app?',
        answer: 'Yes! If your website uses booking systems like Mindbody, Glofox, Zen Planner, or any online booking tool, members can book classes directly from the app.'
      },
      {
        question: 'Can we send class reminder notifications?',
        answer: 'Yes! Send push notifications for class reminders, schedule changes, new class announcements, or promotional offers to keep members engaged.'
      },
      {
        question: 'Do member login portals work?',
        answer: 'Yes, member portals and login systems work seamlessly. Members can view their membership details, billing, and class history within the app.'
      },
      {
        question: 'How does this help member retention?',
        answer: 'Members with your app on their phone are reminded of your gym daily. Push notifications for classes, challenges, and promotions keep them engaged and reduce churn by up to 30%.'
      }
    ]
  },
  {
    slug: 'real-estate-website',
    name: 'Real Estate Website',
    displayName: 'Real Estate Website',
    description: 'Convert your real estate website to a mobile app for property listings, virtual tours, and lead generation',
    icon: '/icons/realestate.svg',
    targetKeyword: 'real estate website to app',
    monthlySearches: 480,
    features: [
      'Property listing display with photos',
      'Advanced property search and filters',
      'Virtual tour and video walkthrough',
      'Contact agent forms',
      'Mortgage calculator integration',
      'Map-based property search',
      'Saved properties and favorites',
      'IDX/MLS integration support'
    ],
    benefits: [
      'Push notifications for new listings',
      'Clients browse properties on the go',
      'Faster lead capture than mobile website',
      'Stand out from other agents without apps',
      'Showcase listings with a professional app',
      'Direct communication channel with buyers'
    ],
    faqs: [
      {
        question: 'How do I convert my real estate website to a mobile app?',
        answer: 'Visit WebsiteToApp.app, enter your real estate website URL, customize the app design, and build. Property listings, search filters, and contact forms all work in the app.'
      },
      {
        question: 'Will IDX/MLS listings work in the app?',
        answer: 'Yes! If your website displays IDX or MLS listings, they will appear in the app exactly as they do on your website, with all search and filter functionality.'
      },
      {
        question: 'Can I notify clients about new listings?',
        answer: 'Yes! Send push notifications when new properties matching your clients\' criteria are listed. This gives you a competitive edge over agents using only email.'
      },
      {
        question: 'Do virtual tours work in the app?',
        answer: 'Yes, virtual tours from Matterport, YouTube 360, or any embedded tour platform work perfectly in the app, giving buyers an immersive property viewing experience.'
      },
      {
        question: 'How does this help generate more leads?',
        answer: 'An app on a client\'s phone keeps you top of mind. Push notifications for new listings drive immediate engagement, and the app makes it easy to contact you with one tap.'
      }
    ]
  },
  {
    slug: 'ecommerce-website',
    name: 'E-commerce Website',
    displayName: 'E-commerce Website',
    description: 'Convert your e-commerce website to a mobile shopping app and boost sales with push notifications and faster checkout',
    icon: '/icons/ecommerce.svg',
    targetKeyword: 'ecommerce website to app',
    monthlySearches: 1300,
    features: [
      'Full shopping cart functionality',
      'Secure payment gateway support',
      'Product catalog with filters',
      'Customer account and order history',
      'Wishlist and favorites',
      'Discount codes and coupons',
      'Order tracking integration',
      'Multi-currency and multi-language'
    ],
    benefits: [
      '3x higher conversion rate than mobile web',
      'Push notifications for sales and abandoned carts',
      'Faster checkout reduces cart abandonment',
      'Build brand loyalty with a dedicated app',
      'Compete with major retailers who have apps',
      'Increase average order value by 20-30%'
    ],
    faqs: [
      {
        question: 'How do I convert my online store to a mobile app?',
        answer: 'Visit WebsiteToApp.app, enter your e-commerce website URL, customize the app, and build. Your product catalog, shopping cart, and checkout process all work in the app regardless of your platform.'
      },
      {
        question: 'Which e-commerce platforms are supported?',
        answer: 'All platforms! Shopify, WooCommerce, Magento, BigCommerce, PrestaShop, OpenCart, custom-built stores — any e-commerce website can be converted to an app.'
      },
      {
        question: 'Will payment gateways work in the app?',
        answer: 'Yes! All payment gateways including Stripe, PayPal, Square, Razorpay, and any other payment processor on your website work seamlessly in the app.'
      },
      {
        question: 'Can I send abandoned cart notifications?',
        answer: 'Yes! Push notifications for abandoned carts typically recover 15-20% of lost sales. You can also notify customers about flash sales, new arrivals, and exclusive deals.'
      },
      {
        question: 'How much more revenue will the app generate?',
        answer: 'E-commerce apps typically see 3x higher conversion rates and 20-30% higher average order values compared to mobile websites. Many stores see 25-45% of total revenue come from their app within 3 months.'
      }
    ]
  },
  {
    slug: 'news-website',
    name: 'News Website',
    displayName: 'News Website',
    description: 'Convert your news or media website to a mobile app with breaking news alerts, offline reading, and real-time updates',
    icon: '/icons/news.svg',
    targetKeyword: 'news website to app',
    monthlySearches: 590,
    features: [
      'Breaking news push notifications',
      'Category-based news feeds',
      'Offline reading and caching',
      'Article sharing functionality',
      'Bookmark and save articles',
      'Photo and video galleries',
      'Live blog and real-time updates',
      'Comment and discussion sections'
    ],
    benefits: [
      'Breaking news alerts reach readers instantly',
      'Increase readership with daily push notifications',
      'Offline reading for commuters and travelers',
      'Reduce dependence on social media for traffic',
      'Build a dedicated reader base',
      'Monetize with in-app advertising'
    ],
    faqs: [
      {
        question: 'How do I convert my news website to a mobile app?',
        answer: 'Go to WebsiteToApp.app, enter your news website URL, customize the app design to match your brand, and build. All your articles, categories, and media content work instantly in the app.'
      },
      {
        question: 'Can I send breaking news notifications?',
        answer: 'Yes! Send push notifications for breaking news, top stories, or category-specific updates. Reach your entire reader base instantly, even when they\'re not browsing your site.'
      },
      {
        question: 'Will ads work in the news app?',
        answer: 'Yes! Your existing website ads (Google AdSense, header bidding, direct ads) display in the app. You can also add AdMob for additional in-app ad revenue.'
      },
      {
        question: 'Does offline reading work?',
        answer: 'Yes! Previously loaded articles are cached for offline reading. Perfect for commuters, travelers, or areas with poor connectivity.'
      },
      {
        question: 'Which news platforms are supported?',
        answer: 'All platforms! WordPress, Ghost, custom CMS, static sites — any news website can be converted. If it works in a browser, it works in the app.'
      }
    ]
  },
  {
    slug: 'lovable',
    name: 'Lovable',
    displayName: 'Lovable',
    description: 'Convert your Lovable AI-generated web app to a native Android app',
    targetKeyword: 'convert lovable app to android',
    monthlySearches: 320,
    features: [
      'Full Lovable web app compatibility',
      'React/Vite app support',
      'Supabase backend integration preserved',
      'Authentication flows maintained',
      'Real-time database features work',
      'Responsive UI auto-adapted for mobile',
      'API integrations preserved',
      'Push notifications support'
    ],
    benefits: [
      'Ship your Lovable app to Google Play Store',
      'No need to rebuild in React Native or Flutter',
      'Convert in minutes, not weeks',
      'Push notifications to engage users',
      'Access native device features (camera, GPS)',
      'Monetize with in-app ads via AdMob'
    ],
    faqs: [
      {
        question: 'Can I convert a Lovable app to an Android app?',
        answer: 'Yes! Lovable generates React web apps that work perfectly with WebsiteToApp. Deploy your Lovable app to any hosting (Vercel, Netlify, etc.), then enter the URL in WebsiteToApp to get an Android APK in minutes.'
      },
      {
        question: 'Will Supabase authentication work in the app?',
        answer: 'Yes! Supabase auth, database, and storage all work seamlessly since the app loads your deployed web app. OAuth providers (Google, GitHub) also work via in-app browser.'
      },
      {
        question: 'Do I need to modify my Lovable code?',
        answer: 'No modifications needed. Deploy your Lovable app as-is, enter the URL, and convert. All React components, routing, and API calls work in the native container.'
      },
      {
        question: 'How long does the conversion take?',
        answer: 'About 10 minutes from start to APK download. Compare that to weeks of rewriting your Lovable app in React Native or Flutter.'
      },
      {
        question: 'Can I publish the converted app on Google Play?',
        answer: 'Yes! You get a signed AAB file ready for Google Play Store submission. We also provide step-by-step guidance for the Play Store listing process.'
      }
    ]
  },
  {
    slug: 'bolt',
    name: 'Bolt.new',
    displayName: 'Bolt.new',
    description: 'Convert your Bolt.new AI-generated web app to a native Android app',
    targetKeyword: 'convert bolt.new app to android',
    monthlySearches: 260,
    features: [
      'Full Bolt.new app compatibility',
      'React/Next.js app support',
      'Server-side rendering preserved',
      'API routes and backend logic work',
      'Third-party integrations maintained',
      'Responsive design auto-adapted',
      'WebSocket connections supported',
      'Push notifications support'
    ],
    benefits: [
      'Ship your Bolt.new prototype to app stores',
      'Perfect for MVP validation on mobile',
      'No code rewrite required',
      'Push notifications to retain users',
      'Monetize your AI-built app with ads',
      'Stand out with a real app store presence'
    ],
    faqs: [
      {
        question: 'Can I convert a Bolt.new app to Android?',
        answer: 'Yes! Deploy your Bolt.new app to any hosting provider, then use WebsiteToApp to wrap it in a native Android container. The entire process takes about 10 minutes.'
      },
      {
        question: 'Will my Bolt.new app\'s backend work?',
        answer: 'Yes! Since your backend runs on the server, all API calls, database connections, and server logic work exactly as they do in the browser.'
      },
      {
        question: 'Is this good for MVP testing?',
        answer: 'Absolutely! Build your MVP with Bolt.new AI, convert to Android with WebsiteToApp, and test with real users on Google Play — all in a single day.'
      },
      {
        question: 'How much does it cost?',
        answer: 'Start free to test your converted app, or get the full version for $35 one-time payment including AAB file for Google Play, push notifications, and AdMob support.'
      }
    ]
  },
  {
    slug: 'v0',
    name: 'v0.dev',
    displayName: 'v0.dev',
    description: 'Convert your v0.dev AI-generated UI to a native Android app',
    targetKeyword: 'convert v0.dev app to android',
    monthlySearches: 210,
    features: [
      'Full v0.dev component compatibility',
      'Next.js and React support',
      'Tailwind CSS styling preserved',
      'shadcn/ui components work perfectly',
      'Server components supported',
      'API routes maintained',
      'Vercel deployment integration',
      'Push notifications support'
    ],
    benefits: [
      'Turn v0.dev prototypes into real mobile apps',
      'Ship AI-designed UI to Google Play',
      'No Flutter or React Native rewrite needed',
      'Beautiful Tailwind UI on mobile',
      'Push notifications for user engagement',
      'Fastest path from AI design to app store'
    ],
    faqs: [
      {
        question: 'Can I convert a v0.dev app to an Android app?',
        answer: 'Yes! Deploy your v0.dev project to Vercel or any host, then use WebsiteToApp to convert it to an Android APK. Your shadcn/ui components and Tailwind styles render perfectly in the app.'
      },
      {
        question: 'Will Next.js features work in the app?',
        answer: 'Yes! Server-side rendering, API routes, middleware, and all Next.js features work because the app loads your deployed web application as-is.'
      },
      {
        question: 'Do shadcn/ui components render correctly?',
        answer: 'Yes! All shadcn/ui components including dialogs, sheets, dropdowns, and forms render perfectly in the native container with full touch support.'
      },
      {
        question: 'How fast is the conversion?',
        answer: 'About 10 minutes. Design with v0.dev AI, deploy to Vercel, convert with WebsiteToApp — you can go from AI prompt to app store in under an hour.'
      }
    ]
  },
  {
    slug: 'bubble',
    name: 'Bubble',
    displayName: 'Bubble',
    description: 'Convert your Bubble no-code web app to a native Android app',
    targetKeyword: 'convert bubble app to android',
    monthlySearches: 880,
    features: [
      'Full Bubble app compatibility',
      'Bubble database and workflows preserved',
      'User authentication maintained',
      'Responsive design auto-adapted',
      'Plugin functionality supported',
      'Stripe and payment integrations work',
      'API connector calls preserved',
      'Push notifications support'
    ],
    benefits: [
      'Ship your Bubble app to Google Play Store',
      'No need to rebuild in native code',
      'Keep all Bubble workflows and logic',
      'Push notifications to engage users',
      'Better mobile performance than Bubble mobile',
      'Monetize with in-app ads'
    ],
    faqs: [
      {
        question: 'Can I convert my Bubble app to an Android app?',
        answer: 'Yes! Your Bubble app runs on Bubble\'s servers and is accessed via URL. Simply enter your Bubble app URL in WebsiteToApp and convert it to a native Android app in minutes.'
      },
      {
        question: 'Will Bubble workflows work in the app?',
        answer: 'Yes! All Bubble workflows, database operations, and backend logic work perfectly since they run on Bubble\'s servers. The app simply provides a native mobile container.'
      },
      {
        question: 'Does Bubble user authentication work?',
        answer: 'Yes! Bubble\'s built-in authentication, including email/password and OAuth providers, works seamlessly in the converted app.'
      },
      {
        question: 'Will Stripe payments work?',
        answer: 'Yes! Stripe and all other payment integrations configured in your Bubble app work in the mobile app, including subscriptions and one-time payments.'
      },
      {
        question: 'How does this compare to Bubble\'s native app option?',
        answer: 'WebsiteToApp is faster and cheaper. You get an APK/AAB file in minutes for a one-time fee, versus Bubble\'s premium plans for native mobile. Plus you get push notifications and AdMob support.'
      }
    ]
  },
  {
    slug: 'replit',
    name: 'Replit',
    displayName: 'Replit',
    description: 'Convert your Replit web app to a native Android app',
    targetKeyword: 'convert replit app to android',
    monthlySearches: 390,
    features: [
      'Full Replit deployment compatibility',
      'Node.js, Python, and any backend support',
      'Database integrations preserved',
      'WebSocket real-time features work',
      'Authentication flows maintained',
      'File upload and storage features',
      'Third-party API integrations',
      'Push notifications support'
    ],
    benefits: [
      'Ship your Replit project to Google Play',
      'Perfect for hackathon projects going mobile',
      'No native development skills required',
      'Push notifications for user engagement',
      'Monetize your side project with ads',
      'Fastest path from code to app store'
    ],
    faqs: [
      {
        question: 'Can I convert a Replit app to an Android app?',
        answer: 'Yes! Deploy your Replit project (it gets a replit.app URL), then use WebsiteToApp to convert it to a native Android APK. Works with any Replit web project.'
      },
      {
        question: 'Will my Replit backend work?',
        answer: 'Yes! Your backend code runs on Replit\'s servers. All API endpoints, database queries, and server-side logic work exactly as they do in the browser.'
      },
      {
        question: 'Which Replit languages are supported?',
        answer: 'Any language that produces a web app — Node.js, Python (Flask/Django), Ruby, Go, Java, and more. If your Replit project has a web interface, it can be converted.'
      },
      {
        question: 'Is this good for hackathon projects?',
        answer: 'Yes! Build on Replit, convert to Android with WebsiteToApp, and demo a real mobile app — all within a hackathon timeline. Takes about 10 minutes to convert.'
      }
    ]
  },
  {
    slug: 'streamlit',
    name: 'Streamlit',
    displayName: 'Streamlit',
    description: 'Convert your Streamlit data app to a native Android app',
    targetKeyword: 'convert streamlit app to android',
    monthlySearches: 480,
    features: [
      'Full Streamlit app compatibility',
      'Interactive widgets and controls',
      'Data visualization charts preserved',
      'File upload and download features',
      'Streamlit authentication support',
      'Custom components work',
      'Real-time data updates',
      'Push notifications support'
    ],
    benefits: [
      'Share your Streamlit dashboard as a mobile app',
      'Data science apps accessible on the go',
      'No mobile development required',
      'Push notifications for data alerts',
      'Stakeholders access dashboards anywhere',
      'Professional app store presence for your tool'
    ],
    faqs: [
      {
        question: 'Can I convert a Streamlit app to an Android app?',
        answer: 'Yes! Deploy your Streamlit app to Streamlit Cloud, Heroku, or any host, then enter the URL in WebsiteToApp to convert it to an Android APK. All widgets and charts work in the app.'
      },
      {
        question: 'Will Streamlit charts and plots work?',
        answer: 'Yes! Plotly, Altair, Matplotlib, and all Streamlit-supported chart libraries render correctly in the app with full interactivity (zoom, hover, pan).'
      },
      {
        question: 'Do file uploads work in the app?',
        answer: 'Yes! Streamlit\'s file_uploader widget works in the app. Users can upload files from their phone storage or camera for processing by your Streamlit backend.'
      },
      {
        question: 'Can I use this for client dashboards?',
        answer: 'Absolutely! Convert your Streamlit dashboard to an app, publish on Google Play, and give clients a professional mobile experience instead of sharing a URL.'
      },
      {
        question: 'Will Streamlit authentication work?',
        answer: 'Yes! Both Streamlit\'s built-in authentication and custom auth solutions (like streamlit-authenticator) work in the converted app.'
      }
    ]
  },
  {
    slug: 'glide',
    name: 'Glide',
    displayName: 'Glide',
    description: 'Convert your Glide app to a native Android app for Google Play Store',
    targetKeyword: 'convert glide app to android',
    monthlySearches: 320,
    features: [
      'Full Glide app compatibility',
      'Google Sheets data source preserved',
      'Glide Tables integration',
      'User authentication maintained',
      'Form submissions work',
      'Image and file handling',
      'Computed columns preserved',
      'Push notifications support'
    ],
    benefits: [
      'Publish your Glide app on Google Play',
      'Native Android experience for users',
      'Push notifications for engagement',
      'No Glide Pro plan required for app store',
      'Better performance than Glide PWA',
      'Monetize with in-app ads'
    ],
    faqs: [
      {
        question: 'Can I convert a Glide app to an Android app?',
        answer: 'Yes! Glide apps are web-based and accessible via URL. Enter your Glide app URL in WebsiteToApp and convert it to a native Android APK for Google Play Store distribution.'
      },
      {
        question: 'Will my Glide data (Google Sheets) still sync?',
        answer: 'Yes! Your data source (Google Sheets or Glide Tables) continues to sync in real-time since Glide handles all data on their servers. Changes appear instantly in the app.'
      },
      {
        question: 'Do Glide actions and automations work?',
        answer: 'Yes! All Glide actions, computed columns, relations, and automations work perfectly in the converted app since they run on Glide\'s backend.'
      },
      {
        question: 'How is this different from Glide\'s own app store publishing?',
        answer: 'Glide requires a Business plan ($60+/month) for app store publishing. With WebsiteToApp, you can convert any Glide app to Android for a one-time $35 fee.'
      }
    ]
  },
  {
    slug: 'django',
    name: 'Django',
    displayName: 'Django',
    description: 'Convert your Django web application to a native Android app',
    targetKeyword: 'convert django app to android',
    monthlySearches: 720,
    features: ['Full Django app compatibility', 'Django REST Framework support', 'Session authentication preserved', 'Admin panel accessible', 'Static files and media served', 'Template-based views work', 'Database-driven content syncs', 'Push notifications support'],
    benefits: ['Ship your Django project to Google Play', 'No need to build a separate API + mobile app', 'All Django features work as-is', 'Push notifications for user engagement', 'Faster than building React Native frontend', 'Monetize with in-app ads'],
    faqs: [
      { question: 'Can I convert a Django app to Android?', answer: 'Yes! Deploy your Django app to any host (Heroku, Railway, DigitalOcean), then use WebsiteToApp to wrap it in a native Android container. All views, forms, and features work.' },
      { question: 'Will Django authentication work?', answer: 'Yes! Django session auth, token auth, and OAuth all work in the app. Users can log in and maintain their session just like in a browser.' },
      { question: 'Does the Django admin panel work?', answer: 'Yes! The admin panel is accessible in the app. You can manage your Django admin from your phone.' }
    ]
  },
  {
    slug: 'laravel',
    name: 'Laravel',
    displayName: 'Laravel',
    description: 'Convert your Laravel web application to a native Android app',
    targetKeyword: 'convert laravel app to android',
    monthlySearches: 880,
    features: ['Full Laravel app compatibility', 'Blade templates render perfectly', 'Laravel Auth preserved', 'Livewire components work', 'Inertia.js support', 'File uploads and storage', 'Payment integrations maintained', 'Push notifications support'],
    benefits: ['Ship your Laravel app to Google Play', 'Livewire and Inertia.js work seamlessly', 'No API rewrite needed', 'Push notifications built-in', 'Monetize with AdMob ads', 'Faster than building a Flutter app'],
    faqs: [
      { question: 'Can I convert a Laravel app to Android?', answer: 'Yes! Deploy your Laravel app and enter the URL in WebsiteToApp. Blade templates, Livewire, and Inertia.js all render perfectly in the native container.' },
      { question: 'Will Laravel Livewire work?', answer: 'Yes! Livewire components work perfectly since they communicate with your Laravel server via AJAX, which works in the WebView container.' },
      { question: 'Does Stripe/payment work?', answer: 'Yes! Laravel Cashier, Stripe, PayPal, and all payment integrations work in the app.' }
    ]
  },
  {
    slug: 'nextjs',
    name: 'Next.js',
    displayName: 'Next.js',
    description: 'Convert your Next.js web application to a native Android app',
    targetKeyword: 'convert nextjs app to android',
    monthlySearches: 590,
    features: ['Full Next.js compatibility', 'Server-side rendering preserved', 'API routes work', 'App Router and Pages Router support', 'Server Actions work', 'Image optimization maintained', 'Authentication (NextAuth) preserved', 'Push notifications support'],
    benefits: ['Ship your Next.js app to Google Play', 'SSR performance on mobile', 'No React Native migration needed', 'All Vercel features work', 'Push notifications for engagement', 'Fastest path from web to mobile'],
    faqs: [
      { question: 'Can I convert a Next.js app to Android?', answer: 'Yes! Deploy to Vercel or any host, enter the URL in WebsiteToApp, and get an Android APK in minutes. SSR, API routes, and all Next.js features work.' },
      { question: 'Will NextAuth work?', answer: 'Yes! NextAuth.js authentication including OAuth providers (Google, GitHub) works seamlessly in the app.' },
      { question: 'Do Server Components work?', answer: 'Yes! React Server Components render on your server and are sent as HTML to the app, just like in a browser.' }
    ]
  },
  {
    slug: 'angular',
    name: 'Angular',
    displayName: 'Angular',
    description: 'Convert your Angular web application to a native Android app',
    targetKeyword: 'convert angular app to android',
    monthlySearches: 720,
    features: ['Full Angular compatibility', 'Angular Material components work', 'RxJS observables preserved', 'Lazy loading modules supported', 'Angular forms and validation', 'HTTP interceptors work', 'Router navigation preserved', 'Push notifications support'],
    benefits: ['Ship your Angular app to Google Play', 'No Ionic or NativeScript migration', 'All Angular features work as-is', 'Push notifications built-in', 'Angular Material looks great on mobile', 'Monetize with AdMob'],
    faqs: [
      { question: 'Can I convert an Angular app to Android?', answer: 'Yes! Build and deploy your Angular app, enter the URL in WebsiteToApp, and convert to a native Android APK. All components and routing work perfectly.' },
      { question: 'Is this better than Ionic?', answer: 'For simple apps, WebsiteToApp is faster (minutes vs hours). For apps needing native device APIs (camera, Bluetooth), Ionic/Capacitor gives more control.' },
      { question: 'Will Angular Material components work?', answer: 'Yes! All Angular Material components render correctly with full touch support in the native container.' }
    ]
  },
  {
    slug: 'vue',
    name: 'Vue.js',
    displayName: 'Vue.js',
    description: 'Convert your Vue.js web application to a native Android app',
    targetKeyword: 'convert vue app to android',
    monthlySearches: 480,
    features: ['Full Vue.js compatibility', 'Vuetify and Quasar support', 'Vue Router preserved', 'Pinia/Vuex state management', 'Nuxt.js SSR support', 'Composition API works', 'Third-party plugins maintained', 'Push notifications support'],
    benefits: ['Ship your Vue.js app to Google Play', 'No Quasar or Capacitor setup needed', 'Works with Nuxt.js SSR apps', 'Push notifications for engagement', 'All Vue plugins work as-is', 'Monetize with in-app ads'],
    faqs: [
      { question: 'Can I convert a Vue.js app to Android?', answer: 'Yes! Deploy your Vue.js or Nuxt.js app, enter the URL, and convert to Android in minutes. All components and routing work perfectly.' },
      { question: 'Will Vuetify/Quasar components work?', answer: 'Yes! Vuetify, Quasar, and all Vue UI frameworks render correctly with touch support in the native container.' },
      { question: 'Does Nuxt.js SSR work?', answer: 'Yes! Nuxt.js server-side rendering works perfectly since the app loads your deployed web application.' }
    ]
  },
  {
    slug: 'notion',
    name: 'Notion',
    displayName: 'Notion',
    description: 'Convert your Notion page or site to a native Android app',
    targetKeyword: 'convert notion to app',
    monthlySearches: 1300,
    features: ['Notion pages render perfectly', 'Database views supported', 'Embedded content works', 'Notion forms accessible', 'Super.so and Notaku compatibility', 'Real-time content updates', 'Image and file galleries', 'Push notifications support'],
    benefits: ['Turn your Notion site into a branded app', 'No coding or design skills needed', 'Content updates instantly from Notion', 'Push notifications to engage readers', 'Professional app store presence', 'Monetize knowledge bases with ads'],
    faqs: [
      { question: 'Can I convert a Notion page to an Android app?', answer: 'Yes! Use a Notion-to-website tool like Super.so or Notaku to give your Notion page a custom domain, then convert that URL to an Android app with WebsiteToApp.' },
      { question: 'Will Notion databases work in the app?', answer: 'Yes! Gallery, table, board, and list views all render correctly in the app with full interactivity.' },
      { question: 'Can I update content from Notion?', answer: 'Yes! Edit your Notion page and changes appear in the app instantly. No app update or rebuild required.' }
    ]
  },
  {
    slug: 'airtable',
    name: 'Airtable',
    displayName: 'Airtable',
    description: 'Convert your Airtable interface or portal to a native Android app',
    targetKeyword: 'convert airtable to app',
    monthlySearches: 720,
    features: ['Airtable Interface Designer support', 'Shared views accessible', 'Form views work', 'Gallery and grid views', 'Filtering and sorting preserved', 'Automations run on backend', 'File attachments accessible', 'Push notifications support'],
    benefits: ['Turn Airtable into a branded mobile app', 'Field workers access data on the go', 'Push notifications for new records', 'No Stacker or Softr subscription needed', 'Professional app for clients', 'Offline-capable with caching'],
    faqs: [
      { question: 'Can I convert an Airtable base to an app?', answer: 'Yes! Share your Airtable view or use Interface Designer to create a portal, then convert that URL to an Android app with WebsiteToApp.' },
      { question: 'Will Airtable forms work?', answer: 'Yes! Airtable form views work in the app. Users can submit data, upload files, and select options just like on the web.' },
      { question: 'Can field workers use this offline?', answer: 'Previously loaded data is cached for offline viewing. New submissions sync when connectivity returns.' }
    ]
  },
  {
    slug: 'google-sites',
    name: 'Google Sites',
    displayName: 'Google Sites',
    description: 'Convert your Google Sites website to a native Android app',
    targetKeyword: 'convert google sites to app',
    monthlySearches: 1600,
    features: ['Full Google Sites compatibility', 'Embedded Google Docs/Sheets work', 'Google Forms integration', 'Google Calendar embeds', 'YouTube video embeds', 'Navigation preserved', 'Multi-page sites supported', 'Push notifications support'],
    benefits: ['Turn your Google Site into a real app', 'Students and staff get a native app', 'Perfect for school and organization apps', 'Push notifications for announcements', 'No coding required at all', 'Free Google Sites + affordable app conversion'],
    faqs: [
      { question: 'Can I convert a Google Sites page to an app?', answer: 'Yes! Enter your Google Sites URL in WebsiteToApp and convert to Android APK in minutes. All embedded Google services (Docs, Sheets, Forms, Calendar) work in the app.' },
      { question: 'Is this good for schools?', answer: 'Yes! Many schools use Google Sites for portals. Convert it to an app so students and parents can access schedules, announcements, and resources from their phones.' },
      { question: 'Will Google Forms work?', answer: 'Yes! Embedded Google Forms work perfectly in the app for surveys, quizzes, and data collection.' }
    ]
  },
  {
    slug: 'carrd',
    name: 'Carrd',
    displayName: 'Carrd',
    description: 'Convert your Carrd one-page site to a native Android app',
    targetKeyword: 'convert carrd to app',
    monthlySearches: 390,
    features: ['Full Carrd site compatibility', 'Forms and contact widgets work', 'Stripe payment buttons supported', 'Animations preserved', 'Custom domains supported', 'Responsive layout maintained', 'Embedded widgets work', 'Push notifications support'],
    benefits: ['Turn your Carrd landing page into an app', 'Perfect for personal brands and portfolios', 'Push notifications for updates', 'App store presence for your brand', 'No coding skills needed', 'Most affordable path to an app'],
    faqs: [
      { question: 'Can I convert a Carrd site to an app?', answer: 'Yes! Enter your Carrd site URL and convert to an Android app in minutes. All Carrd features including forms, payments, and animations work in the app.' },
      { question: 'Will my Carrd forms work?', answer: 'Yes! Contact forms, newsletter signup forms, and all Carrd form widgets work perfectly in the app.' }
    ]
  },
  {
    slug: 'framer',
    name: 'Framer',
    displayName: 'Framer',
    description: 'Convert your Framer website to a native Android app',
    targetKeyword: 'convert framer site to app',
    monthlySearches: 480,
    features: ['Full Framer site compatibility', 'Animations and interactions preserved', 'CMS content dynamic loading', 'Forms and integrations work', 'Custom code components supported', 'Responsive breakpoints maintained', 'SEO-optimized content preserved', 'Push notifications support'],
    benefits: ['Ship your beautiful Framer site as an app', 'Animations look stunning on mobile', 'CMS updates appear instantly in app', 'Push notifications for new content', 'No development skills required', 'App store presence for your brand'],
    faqs: [
      { question: 'Can I convert a Framer website to an app?', answer: 'Yes! Framer sites are fast, responsive web apps. Enter your Framer URL in WebsiteToApp and get an Android APK with all animations and interactions preserved.' },
      { question: 'Will Framer animations work?', answer: 'Yes! Framer motion animations, scroll effects, and hover interactions all work in the app. The native container renders them smoothly.' }
    ]
  },
  {
    slug: 'shopify-store',
    name: 'Shopify Store',
    displayName: 'Shopify Store',
    description: 'Convert your Shopify store to a mobile shopping app for Android',
    targetKeyword: 'shopify store to app',
    monthlySearches: 2400,
    features: ['Full Shopify store compatibility', 'Product catalog and search', 'Cart and checkout work perfectly', 'Shopify Payments supported', 'Customer accounts maintained', 'Discount codes and promotions', 'Order tracking accessible', 'Push notifications for sales'],
    benefits: ['3x higher conversion rates vs mobile web', 'Push notifications recover abandoned carts', 'Customers shop with one tap from home screen', 'Increase repeat purchases by 40%', 'Stand out from competitors', 'Monetize with push notification promotions'],
    faqs: [
      { question: 'How do I convert my Shopify store to an app?', answer: 'Enter your Shopify store URL (yourstore.myshopify.com or custom domain) in WebsiteToApp. Customize the app, build, and get your APK/AAB for Google Play. Takes 10 minutes.' },
      { question: 'Will Shopify Payments work?', answer: 'Yes! Shopify Payments, Shop Pay, PayPal, Apple Pay, Google Pay, and all payment methods work in the app.' },
      { question: 'Can I send abandoned cart notifications?', answer: 'Yes! Push notifications let you remind customers about abandoned carts, announce flash sales, and promote new products.' },
      { question: 'How much does a Shopify app cost?', answer: 'WebsiteToApp costs $35 one-time (not monthly). Compare that to custom Shopify mobile apps that cost $5,000-$50,000.' }
    ]
  },
  {
    slug: 'woocommerce',
    name: 'WooCommerce',
    displayName: 'WooCommerce',
    description: 'Convert your WooCommerce store to a mobile shopping app for Android',
    targetKeyword: 'woocommerce to app',
    monthlySearches: 1900,
    features: ['Full WooCommerce compatibility', 'Product pages and galleries', 'Variable products and attributes', 'Cart and checkout flow', 'All payment gateways supported', 'Customer login and order history', 'Coupon codes and discounts', 'Push notifications support'],
    benefits: ['Boost WooCommerce sales with a mobile app', 'Push notifications for promotions', '3x higher mobile conversion rate', 'Customers shop offline with cached products', 'Build customer loyalty with app exclusives', 'No WooCommerce plugin subscription needed'],
    faqs: [
      { question: 'Can I convert WooCommerce to an Android app?', answer: 'Yes! Enter your WooCommerce store URL in WebsiteToApp and convert in minutes. All products, cart, checkout, and payment gateways work in the app.' },
      { question: 'Will WooCommerce plugins work?', answer: 'Yes! All WooCommerce plugins that add frontend features (product sliders, wishlists, live chat) work in the app since they render in the browser.' },
      { question: 'Does it work with all payment gateways?', answer: 'Yes! Stripe, PayPal, Razorpay, Square, and any WooCommerce payment gateway works in the converted app.' }
    ]
  },
  {
    slug: 'magento',
    name: 'Magento',
    displayName: 'Magento',
    description: 'Convert your Magento ecommerce store to a native Android app',
    targetKeyword: 'magento to app',
    monthlySearches: 590,
    features: ['Full Magento 2 compatibility', 'Product catalog and layered navigation', 'Customer accounts and wishlists', 'Multi-store support', 'All payment methods work', 'Configurable and bundle products', 'Order tracking and returns', 'Push notifications support'],
    benefits: ['Mobile app for your Magento store', 'Push notifications drive repeat purchases', 'Better mobile UX than Magento responsive', 'No PWA Studio setup required', 'Fraction of the cost of Magento mobile apps', 'Ship to Google Play in minutes'],
    faqs: [
      { question: 'Can I convert Magento to an Android app?', answer: 'Yes! Enter your Magento store URL and convert to Android in minutes. All products, categories, checkout, and customer features work.' },
      { question: 'Is this cheaper than Magento PWA Studio?', answer: 'Much cheaper. PWA Studio requires significant development effort. WebsiteToApp converts your existing Magento site for a one-time $35 fee.' }
    ]
  },
  {
    slug: 'flutterflow',
    name: 'FlutterFlow',
    displayName: 'FlutterFlow',
    description: 'Convert your FlutterFlow web app to a native Android app',
    targetKeyword: 'convert flutterflow app to android',
    monthlySearches: 390,
    features: [
      'FlutterFlow web app compatibility',
      'Firebase backend integration preserved',
      'User authentication maintained',
      'Firestore database sync',
      'Stripe payment integration',
      'Custom actions and API calls work',
      'Responsive layout preserved',
      'Push notifications support'
    ],
    benefits: [
      'Faster alternative to FlutterFlow native export',
      'No Flutter SDK setup required',
      'Push notifications without Firebase Cloud Messaging setup',
      'AdMob monetization built-in',
      'Quick APK for testing before full Flutter build',
      'Ship to Google Play in minutes'
    ],
    faqs: [
      {
        question: 'Why convert FlutterFlow web app instead of exporting Flutter code?',
        answer: 'FlutterFlow can export Flutter code, but it requires Flutter SDK setup, Android Studio, and build configuration. WebsiteToApp lets you convert the web version instantly for quick testing or if you want a simpler deployment process.'
      },
      {
        question: 'Will Firebase features work in the app?',
        answer: 'Yes! Firebase Auth, Firestore, Storage, and all Firebase services work because they\'re accessed through your FlutterFlow web app which runs as normal in the native container.'
      },
      {
        question: 'Is this a replacement for FlutterFlow\'s native build?',
        answer: 'It\'s a faster alternative. For quick MVPs, testing, or simple apps, WebsiteToApp conversion is much faster. For complex apps requiring deep native integration, FlutterFlow\'s native export may be better.'
      },
      {
        question: 'Do Stripe payments work?',
        answer: 'Yes! Stripe checkout and all payment flows configured in your FlutterFlow app work in the converted Android app.'
      }
    ]
  },
  {
    slug: 'website-to-desktop-app',
    name: 'Desktop App',
    displayName: 'Desktop App',
    description: 'Convert your website into a Windows desktop application (.exe) with system tray, auto-updates, and offline support',
    targetKeyword: 'convert website to desktop app',
    monthlySearches: 1900,
    features: [
      'Windows .exe installer generation',
      'System tray integration',
      'Auto-update support',
      'Offline mode with local caching',
      'Custom window size and title',
      'Keyboard shortcuts support',
      'Native file system access',
      'Multi-monitor support'
    ],
    benefits: [
      'Desktop presence without Electron development',
      'One-click install for users — no browser needed',
      'Runs on startup option',
      'Faster than browser — dedicated window',
      'Works offline with cached content',
      'Professional .exe installer with your branding'
    ],
    faqs: [
      {
        question: 'Can I convert any website to a desktop app?',
        answer: 'Yes, any website with a URL can be converted to a Windows desktop app. The app wraps your website in a native window with full desktop features like system tray, auto-updates, and offline support.'
      },
      {
        question: 'What format is the desktop app?',
        answer: 'The desktop app is generated as a Windows .exe installer. Users can download and install it like any other Windows application. It appears in the Start menu and can be pinned to the taskbar.'
      },
      {
        question: 'Does the desktop app work offline?',
        answer: 'Yes, the desktop app includes offline caching. Pages visited while online are cached and available offline. You can also configure which pages to pre-cache for full offline support.'
      },
      {
        question: 'Can I customize the desktop app window?',
        answer: 'Yes, you can set custom window size, title, icon, and whether it shows in the system tray. You can also enable always-on-top mode and configure keyboard shortcuts.'
      },
      {
        question: 'Is it different from Electron?',
        answer: 'Similar concept but much simpler. You don\'t need to write any code. Just enter your URL, customize settings, and get a .exe installer. No Node.js, no coding, no Electron setup required.'
      }
    ]
  },
  {
    slug: 'website-to-windows-app',
    name: 'Windows App',
    displayName: 'Windows App',
    description: 'Turn your website into a native Windows application with .exe installer, taskbar icon, and auto-updates',
    targetKeyword: 'convert website to windows app',
    monthlySearches: 1300,
    features: [
      'Native Windows .exe application',
      'Taskbar and Start menu integration',
      'Custom app icon and branding',
      'Auto-update mechanism',
      'System tray with notifications',
      'Full-screen and windowed modes',
      'Keyboard shortcut support',
      'Windows 10 and 11 compatible'
    ],
    benefits: [
      'Professional Windows application without coding',
      'Users install once — always accessible from desktop',
      'Faster loading than opening in browser',
      'Brand presence on user\'s desktop',
      'Push notification support via system tray',
      'No browser tab competition — dedicated window'
    ],
    faqs: [
      {
        question: 'How do I convert my website to a Windows app?',
        answer: 'Enter your website URL on WebsiteToApp, choose "Windows Desktop" as the target platform, customize the app icon and window settings, then download your .exe installer. The entire process takes under 5 minutes.'
      },
      {
        question: 'What Windows versions are supported?',
        answer: 'The generated Windows app works on Windows 10 and Windows 11 (64-bit). It uses modern web technologies to render your website in a native window.'
      },
      {
        question: 'Can I distribute the Windows app to my users?',
        answer: 'Yes, you get a standalone .exe installer that you can distribute via your website, email, or any file sharing service. Users double-click to install — no admin rights required for per-user installation.'
      },
      {
        question: 'Does it support auto-updates?',
        answer: 'Yes, the Windows app checks for updates automatically. When you update your website, the desktop app reflects changes on next launch or via background update check.'
      },
      {
        question: 'Can I convert to both Android and Windows?',
        answer: 'Yes! WebsiteToApp supports both Android APK and Windows .exe generation from the same website URL. Build once, deploy on both platforms.'
      }
    ]
  },
  {
    slug: 'website-to-exe',
    name: 'EXE Converter',
    displayName: 'EXE File',
    description: 'Convert any website to a downloadable .exe file for Windows. No coding, no Electron setup required',
    targetKeyword: 'website to exe converter',
    monthlySearches: 2400,
    features: [
      'One-click .exe generation',
      'Custom icon and splash screen',
      'Offline mode support',
      'Auto-update built-in',
      'System tray integration',
      'Custom window dimensions',
      'JavaScript injection support',
      'No coding required'
    ],
    benefits: [
      'Distribute your web app as a downloadable program',
      'Users don\'t need to open a browser',
      'Professional installer with your branding',
      'Works offline after first visit',
      'Appears in Windows Start menu and taskbar',
      'Much simpler than building with Electron from scratch'
    ],
    faqs: [
      {
        question: 'How do I convert my website to an .exe file?',
        answer: 'Simply enter your website URL on WebsiteToApp, select Windows Desktop as the platform, customize your app name and icon, and download the .exe installer. No coding or technical knowledge needed.'
      },
      {
        question: 'Is this the same as Electron?',
        answer: 'The concept is similar — wrapping a web app in a native window. But unlike Electron, you don\'t need to write any code, set up Node.js, or configure build tools. WebsiteToApp handles everything automatically.'
      },
      {
        question: 'What\'s the file size of the generated .exe?',
        answer: 'The generated .exe is typically 50-80MB, which includes the web rendering engine. This is comparable to other web-based desktop apps like Slack, Discord, or VS Code.'
      },
      {
        question: 'Can I convert a web app (SaaS) to .exe?',
        answer: 'Yes, SaaS applications, dashboards, admin panels, and any web-based tool can be converted. Login flows, API calls, and all web functionality work exactly as in the browser.'
      },
      {
        question: 'Is the .exe safe for users to install?',
        answer: 'Yes, the .exe is clean and safe. You can optionally code-sign it with your own certificate to remove Windows SmartScreen warnings. The app only loads content from your specified URL.'
      }
    ]
  },
  {
    slug: 'small-business-to-app',
    name: 'Small Business',
    displayName: 'Small Business Website',
    description: 'Convert your small business website to a professional mobile app with no coding. Reach customers on their phones, send push notifications, and grow your business with a dedicated app.',
    icon: '/icons/business.svg',
    targetKeyword: 'small business app builder no code',
    monthlySearches: 1300,
    features: [
      'Works with any website builder (Wix, WordPress, Squarespace, GoDaddy)',
      'Online booking and appointment scheduling preserved',
      'Contact forms and click-to-call functionality',
      'Google Maps and directions integration',
      'Business hours and service information display',
      'Customer reviews and testimonials section',
      'Social media links and sharing',
      'Photo gallery for products and services'
    ],
    benefits: [
      'Push notifications bring customers back 3x more often',
      'App icon on customer phones = constant brand visibility',
      'Faster than mobile website — better customer experience',
      'Compete with big brands that have dedicated apps',
      'No coding skills or developers needed',
      'One-time cost — no monthly app builder subscriptions'
    ],
    faqs: [
      {
        question: 'How do I convert my small business website to a mobile app?',
        answer: 'Visit WebsiteToApp.app, enter your business website URL, customize the app icon, colors, and features, then build. You get an APK file for Android in about 10 minutes. No coding or technical skills required — if you can copy and paste a URL, you can build an app.'
      },
      {
        question: 'Do I need a special website to create an app?',
        answer: 'No. Any website works — WordPress, Wix, Squarespace, GoDaddy, Shopify, or even a basic HTML site. As long as your website loads in a browser, it can be converted to a mobile app. Your site should be mobile-responsive for the best app experience.'
      },
      {
        question: 'How much does it cost to build a small business app?',
        answer: 'WebsiteToApp starts free for basic features. The full version costs $35 one-time — no monthly fees. Compare that to custom app development ($10,000-$50,000) or monthly app builders ($50-$300/month). It is the most affordable way for small businesses to get a mobile app.'
      },
      {
        question: 'Can I send push notifications to my customers?',
        answer: 'Yes! Push notifications are included. Send promotions, appointment reminders, new product announcements, or special offers directly to your customers phones. Businesses using push notifications see 3-10x more repeat visits compared to email marketing.'
      },
      {
        question: 'Will my online booking system work in the app?',
        answer: 'Yes. Booking systems like Calendly, Acuity, Square Appointments, Booksy, and any web-based scheduling tool work perfectly in the app. Customers can book appointments directly from the app on their phone.'
      },
      {
        question: 'Can I publish the app on Google Play Store?',
        answer: 'Yes! WebsiteToApp generates both APK (for direct sharing) and AAB (for Google Play Store) files. You need a Google Play Developer account ($25 one-time fee from Google) to publish. We provide step-by-step instructions for the submission process.'
      },
      {
        question: 'What types of small businesses benefit most from an app?',
        answer: 'Restaurants, salons, gyms, dental clinics, law firms, real estate agencies, retail stores, cleaning services, tutoring centers, and any local service business. Basically, any business that wants repeat customers benefits from having an app on their customers phones.'
      },
      {
        question: 'How do I update the app content?',
        answer: 'You do not need to update the app itself. The app loads your live website, so when you update your website (new products, changed hours, blog posts), those changes appear in the app instantly. No rebuilding or republishing required.'
      }
    ]
  },
  {
    slug: 'no-code-website-app-converter',
    name: 'No-Code App Converter',
    displayName: 'No-Code App',
    description: 'Convert any website into a mobile app without coding. Enter your URL, customize, and download APK in minutes.',
    targetKeyword: 'no code website to mobile app converter',
    monthlySearches: 1600,
    features: [
      'Zero coding required — just paste your URL',
      'Works with any website or web app',
      'Custom app icon and splash screen',
      'Push notifications built-in',
      'Offline mode support',
      'Play Store ready (APK + AAB formats)',
      'AdMob integration for monetization',
      'Works with WordPress, Shopify, Wix, React, and more'
    ],
    benefits: [
      'Launch your app in minutes, not months',
      'No developers needed — save thousands in development costs',
      'Your website becomes a native app experience',
      'Push notifications bring users back 3x more often',
      'App icon on users home screen = brand presence',
      'Play Store listing increases discoverability'
    ],
    faqs: [
      {
        question: 'Can I really convert my website to an app without coding?',
        answer: 'Yes! WebsiteToApp wraps your website in a native Android container with push notifications, offline mode, and Play Store publishing. Just enter your URL and customize.'
      },
      {
        question: 'Which websites work with the converter?',
        answer: 'Any website with a URL works — WordPress, Shopify, Wix, Squarespace, React, HTML, or any custom site. If it loads in a browser, it can become an app.'
      },
      {
        question: 'How long does it take to get my app?',
        answer: 'Under 5 minutes. Enter your URL, upload your icon, configure features, and download your APK. No waiting for developers or app builders.'
      },
      {
        question: 'Can I publish the app to Google Play Store?',
        answer: 'Yes! The converter generates both APK (for direct install) and AAB (for Play Store publishing). Your app is ready for Google Play submission.'
      },
      {
        question: 'Is there a free plan?',
        answer: 'Yes — the free plan includes 1 app build with basic features. Premium plans start at $9.99 for additional features like push notifications and custom splash screens.'
      }
    ]
  }
]
