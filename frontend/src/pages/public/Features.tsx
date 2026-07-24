import { Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'
import {
  Smartphone, Bell, Fingerprint, QrCode, WifiOff, Shield, Navigation, Camera, MapPin, Upload, Code, Palette, Monitor, ArrowRight, Apple,
  Share2, Download, RotateCw, Maximize, RefreshCw, Star, LogOut, ArrowLeft, Cookie, Database, Settings,
  Globe, Video, Volume2, Vibrate, Wifi, Battery, Info, Zap, BarChart, AlertCircle, FileText, Languages, Check, X
} from 'lucide-react'

const allFeatures = [
  // Core Platform Features
  {
    icon: Smartphone,
    title: 'Android App',
    desc: 'Your website runs as a full-screen native Android app. Users get a smooth, app-like experience with no address bar.',
    category: 'Platform',
  },
  {
    icon: Monitor,
    title: 'Windows Desktop App',
    desc: 'Generate a Windows .exe installer for your website. Configure window size, title bar, menu bar, system tray, and fullscreen mode.',
    category: 'Platform',
  },
  {
    icon: Apple,
    title: 'iOS App (Beta)',
    desc: 'Get an unsigned .ipa plus the full Xcode source project. Sign and publish it with your own Apple Developer account — same price as Android.',
    category: 'Platform',
  },

  // Engagement Features
  {
    icon: Bell,
    title: 'Push Notifications',
    desc: 'Send push notifications to your app users. Create campaigns, schedule sends, and target all users or specific topics.',
    category: 'Engagement',
  },
  {
    icon: Share2,
    title: 'Social Sharing',
    desc: 'Native share functionality to share content from your app to social media, messaging apps, and more.',
    category: 'Engagement',
  },
  {
    icon: Star,
    title: 'Rate App Dialog',
    desc: 'Prompt users to rate your app on Google Play Store with customizable timing and messaging.',
    category: 'Engagement',
  },
  {
    icon: RefreshCw,
    title: 'Pull to Refresh',
    desc: 'Add the familiar pull-to-refresh gesture to reload content in your app.',
    category: 'Engagement',
  },

  // Security Features
  {
    icon: Fingerprint,
    title: 'Biometric Authentication',
    desc: 'Require fingerprint or face unlock before the app opens. Adds an extra layer of security for your users.',
    category: 'Security',
  },
  {
    icon: Shield,
    title: 'Screenshot Prevention',
    desc: 'Block screenshots and screen recording inside the app for content protection.',
    category: 'Security',
  },
  {
    icon: Shield,
    title: 'SSL Pinning',
    desc: 'Enhanced security with certificate pinning to prevent man-in-the-middle attacks.',
    category: 'Security',
  },
  {
    icon: Shield,
    title: 'Content Security Policy',
    desc: 'Configure CSP headers to prevent XSS attacks and other security vulnerabilities.',
    category: 'Security',
  },

  // Device Features
  {
    icon: QrCode,
    title: 'QR Code Scanner',
    desc: 'Built-in QR code scanner that can be triggered from your website or as a standalone feature.',
    category: 'Device',
  },
  {
    icon: Camera,
    title: 'Camera Access',
    desc: 'Full camera integration for photo uploads, video capture, and more.',
    category: 'Device',
  },
  {
    icon: MapPin,
    title: 'Location Services',
    desc: 'GPS access for location-based features with proper permission handling.',
    category: 'Device',
  },
  {
    icon: Vibrate,
    title: 'Vibration API',
    desc: 'Trigger device vibration for notifications, feedback, and interactive experiences.',
    category: 'Device',
  },
  {
    icon: Battery,
    title: 'Battery Status',
    desc: 'Access battery level and charging status to optimize app behavior.',
    category: 'Device',
  },
  {
    icon: Info,
    title: 'Device Info',
    desc: 'Get device details like model, OS version, screen size, and unique identifiers.',
    category: 'Device',
  },

  // Navigation & UI
  {
    icon: Navigation,
    title: 'Custom Navigation',
    desc: 'Add a bottom navigation bar with custom links and icons to help users navigate your app.',
    category: 'Navigation',
  },
  {
    icon: Globe,
    title: 'Deep Linking',
    desc: 'Open specific pages in your app from external links, emails, and notifications.',
    category: 'Navigation',
  },
  {
    icon: Globe,
    title: 'In-App Browser',
    desc: 'Open external links in a customizable in-app browser instead of the default browser.',
    category: 'Navigation',
  },
  {
    icon: ArrowLeft,
    title: 'Back Button Handling',
    desc: 'Custom back button behavior with confirmation dialogs and navigation control.',
    category: 'Navigation',
  },
  {
    icon: LogOut,
    title: 'Exit Confirmation',
    desc: 'Show a confirmation dialog when users try to exit the app.',
    category: 'Navigation',
  },

  // Customization
  {
    icon: Palette,
    title: 'Full Branding',
    desc: 'Custom app icon, splash screen, colors, status bar styling, and navigation bar colors.',
    category: 'Customization',
  },
  {
    icon: Palette,
    title: 'Custom Fonts',
    desc: 'Use your brand fonts throughout the app for consistent typography.',
    category: 'Customization',
  },
  {
    icon: Settings,
    title: 'User Agent Control',
    desc: 'Set a custom user agent string to control how your website detects the app.',
    category: 'Customization',
  },
  {
    icon: RotateCw,
    title: 'Orientation Control',
    desc: 'Lock screen orientation to portrait, landscape, or allow both.',
    category: 'Customization',
  },
  {
    icon: Maximize,
    title: 'Full Screen Modes',
    desc: 'Support for fullscreen, immersive mode, and sticky immersive for maximum screen real estate.',
    category: 'Customization',
  },
  {
    icon: Monitor,
    title: 'Keep Screen On',
    desc: 'Prevent screen from turning off during important tasks or content viewing.',
    category: 'Customization',
  },

  // Data & Storage
  {
    icon: Upload,
    title: 'File Upload',
    desc: 'Support for file uploads from the device including images, documents, and more.',
    category: 'Data',
  },
  {
    icon: Download,
    title: 'Download Manager',
    desc: 'Handle file downloads with progress tracking and notification support.',
    category: 'Data',
  },
  {
    icon: WifiOff,
    title: 'Offline Mode',
    desc: 'Cache pages for offline access. Show a branded offline page when no internet connection is available.',
    category: 'Data',
  },
  {
    icon: Cookie,
    title: 'Cookie Management',
    desc: 'Full control over cookies, session storage, and local storage.',
    category: 'Data',
  },
  {
    icon: Database,
    title: 'Cache Management',
    desc: 'Configure cache behavior, clear cache, and manage app data storage.',
    category: 'Data',
  },

  // Advanced Features
  {
    icon: Code,
    title: 'JavaScript Bridge',
    desc: 'Communicate between your website and native app features. Show rewarded/interstitial ads, access device info, share content, trigger vibration, and more.',
    category: 'Advanced',
  },
  {
    icon: Settings,
    title: 'Custom Headers',
    desc: 'Add custom HTTP headers to all requests for authentication and tracking.',
    category: 'Advanced',
  },
  {
    icon: Zap,
    title: 'Hardware Acceleration',
    desc: 'Enable GPU acceleration for smooth animations and better performance.',
    category: 'Advanced',
  },
  {
    icon: Globe,
    title: 'Mixed Content Support',
    desc: 'Allow HTTP content on HTTPS pages when needed for legacy systems.',
    category: 'Advanced',
  },
  {
    icon: Settings,
    title: 'WebView Configuration',
    desc: 'Full control over WebView settings including JavaScript, zoom, and DOM storage.',
    category: 'Advanced',
  },

  // Media & Monetization
  {
    icon: Video,
    title: 'Media Playback',
    desc: 'Optimized video and audio playback with fullscreen support and controls.',
    category: 'Media',
  },
  {
    icon: Volume2,
    title: 'Audio Focus',
    desc: 'Proper audio focus handling for media apps and music players.',
    category: 'Media',
  },
  {
    icon: Monitor,
    title: 'AdMob Integration',
    desc: 'Monetize your app with Google AdMob banner, interstitial, and rewarded ads.',
    category: 'Monetization',
  },

  // Analytics & Monitoring
  {
    icon: BarChart,
    title: 'Analytics Integration',
    desc: 'Built-in Google Analytics and Firebase Analytics support for tracking user behavior.',
    category: 'Analytics',
  },
  {
    icon: AlertCircle,
    title: 'Crash Reporting',
    desc: 'Automatic crash detection and reporting with stack traces.',
    category: 'Analytics',
  },
  {
    icon: FileText,
    title: 'Error Logging',
    desc: 'Comprehensive error logging for debugging and monitoring.',
    category: 'Analytics',
  },
  {
    icon: Wifi,
    title: 'Network Monitoring',
    desc: 'Track network status and connection changes in real-time.',
    category: 'Analytics',
  },

  // Updates & Localization
  {
    icon: Zap,
    title: 'App Updates',
    desc: 'In-app update prompts and forced update capability for critical releases.',
    category: 'Updates',
  },
  {
    icon: Settings,
    title: 'Remote Config',
    desc: 'Change app behavior and content without releasing a new version.',
    category: 'Updates',
  },
  {
    icon: Languages,
    title: 'Multi-Language',
    desc: 'Support for multiple languages and RTL (right-to-left) layouts.',
    category: 'Localization',
  },
]

const categories = [
  { name: 'Platform', color: 'from-blue-50 to-blue-100 border-blue-200', icon: Smartphone },
  { name: 'Engagement', color: 'from-purple-50 to-purple-100 border-purple-200', icon: Bell },
  { name: 'Security', color: 'from-red-50 to-red-100 border-red-200', icon: Shield },
  { name: 'Device', color: 'from-green-50 to-green-100 border-green-200', icon: Camera },
  { name: 'Navigation', color: 'from-orange-50 to-orange-100 border-orange-200', icon: Navigation },
  { name: 'Customization', color: 'from-pink-50 to-pink-100 border-pink-200', icon: Palette },
  { name: 'Data', color: 'from-teal-50 to-teal-100 border-teal-200', icon: Database },
  { name: 'Advanced', color: 'from-indigo-50 to-indigo-100 border-indigo-200', icon: Code },
  { name: 'Media', color: 'from-yellow-50 to-yellow-100 border-yellow-200', icon: Video },
  { name: 'Monetization', color: 'from-emerald-50 to-emerald-100 border-emerald-200', icon: Monitor },
  { name: 'Analytics', color: 'from-cyan-50 to-cyan-100 border-cyan-200', icon: BarChart },
  { name: 'Updates', color: 'from-violet-50 to-violet-100 border-violet-200', icon: Zap },
  { name: 'Localization', color: 'from-amber-50 to-amber-100 border-amber-200', icon: Languages },
]

export default function Features() {
  useSEO({
    title: 'Features - 40+ Premium App Features',
    description: 'Push notifications, biometric auth, offline mode, AdMob, QR scanner, deep linking, custom navigation, and 40+ more features. All included in one plan.',
  })

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
            <Check className="w-5 h-5" />
            <span className="font-semibold">All Features Included in Every Plan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">40+ Premium Features</h1>
          <p className="text-primary-100 text-lg sm:text-xl max-w-3xl mx-auto mb-8">
            Everything you need to create professional Android, Windows desktop, and iOS apps from your website. No coding required.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="font-bold text-2xl">{allFeatures.length}</div>
              <div className="text-primary-100">Total Features</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="font-bold text-2xl">{categories.length}</div>
              <div className="text-primary-100">Categories</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="font-bold text-2xl">$25</div>
              <div className="text-primary-100">One-Time Price</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features by Category */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
        <div className="space-y-16">
          {categories.map((category) => {
            const categoryFeatures = allFeatures.filter(f => f.category === category.name)
            if (categoryFeatures.length === 0) return null

            return (
              <div key={category.name} id={category.name.toLowerCase()}>
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-12 h-12 bg-gradient-to-br ${category.color} border rounded-xl flex items-center justify-center`}>
                    <category.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold">{category.name}</h2>
                    <p className="text-gray-600">{categoryFeatures.length} features</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryFeatures.map((feature) => (
                    <div key={feature.title} className="border rounded-xl p-6 hover:shadow-lg hover:border-primary-200 transition-all bg-white">
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">WebsiteToApp vs Competitors</h2>
            <p className="text-gray-600 text-lg">See how we compare to other solutions</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary-600">WebsiteToApp</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Competitor A</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Competitor B</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Competitor C</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium">Total Features</td>
                    <td className="px-6 py-4 text-center"><span className="font-bold text-primary-600">40+</span></td>
                    <td className="px-6 py-4 text-center text-gray-600">15-20</td>
                    <td className="px-6 py-4 text-center text-gray-600">20-25</td>
                    <td className="px-6 py-4 text-center text-gray-600">10-15</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">One-Time Pricing</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium">Push Notifications</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">Desktop Apps</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium">Biometric Authentication</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">AdMob Integration</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium">QR Code Scanner</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">Screenshot Prevention</td>
                    <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  </tr>
                  <tr className="bg-primary-50">
                    <td className="px-6 py-4 text-sm font-bold">Price (Android)</td>
                    <td className="px-6 py-4 text-center"><span className="font-bold text-primary-600">$25</span></td>
                    <td className="px-6 py-4 text-center text-gray-600">$99/year</td>
                    <td className="px-6 py-4 text-center text-gray-600">$149/year</td>
                    <td className="px-6 py-4 text-center text-gray-600">$24</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Savings Calculator */}
          <div className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">You Save $470+ Over 5 Years</h3>
            <p className="text-gray-600 mb-6">Compared to subscription-based competitors with our one-time pricing</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <div className="text-primary-600 font-bold text-3xl">$25</div>
                <div className="text-gray-600 text-sm">WebsiteToApp (One-Time)</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 opacity-75">
                <div className="text-gray-600 font-bold text-3xl">$495</div>
                <div className="text-gray-600 text-sm">Competitor A (5 Years)</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 opacity-75">
                <div className="text-gray-600 font-bold text-3xl">$745</div>
                <div className="text-gray-600 text-sm">Competitor B (5 Years)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Build Your App?</h2>
          <p className="text-primary-100 text-lg mb-8">Get all 40+ features for just $25. No subscriptions, no hidden fees.</p>
          <Link to="/register" className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100 transition-all text-lg shadow-xl">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
