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
  }
]
