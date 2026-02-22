import { Link } from 'react-router-dom'
import {
  Smartphone, Bell, Fingerprint, QrCode, WifiOff,
  Shield, Navigation, Camera, MapPin, Upload, Code, Palette, Monitor, ArrowRight
} from 'lucide-react'

const allFeatures = [
  {
    icon: Smartphone,
    title: 'Android App',
    desc: 'Your website runs as a full-screen native Android app. Users get a smooth, app-like experience with no address bar.',
    plans: ['Free', 'Basic', 'Pro', 'Business'],
  },
  {
    icon: Monitor,
    title: 'Windows Desktop App',
    desc: 'Generate a Windows .exe installer for your website. Configure window size, title bar, menu bar, system tray, and fullscreen mode.',
    plans: ['Basic', 'Pro', 'Business'],
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    desc: 'Send push notifications to your app users. Create campaigns, schedule sends, and target all users or specific topics.',
    plans: ['Basic', 'Pro', 'Business'],
  },
  {
    icon: Fingerprint,
    title: 'Biometric Authentication',
    desc: 'Require fingerprint or face unlock before the app opens. Adds an extra layer of security for your users.',
    plans: ['Pro', 'Business'],
  },
  {
    icon: QrCode,
    title: 'QR Code Scanner',
    desc: 'Built-in QR code scanner that can be triggered from your website or as a standalone feature.',
    plans: ['Pro', 'Business'],
  },
  {
    icon: WifiOff,
    title: 'Offline Mode',
    desc: 'Cache pages for offline access. Show a branded offline page when no internet connection is available.',
    plans: ['Basic', 'Pro', 'Business'],
  },
  {
    icon: Shield,
    title: 'Screenshot Prevention',
    desc: 'Block screenshots and screen recording inside the app for content protection.',
    plans: ['Pro', 'Business'],
  },
  {
    icon: Navigation,
    title: 'Custom Navigation',
    desc: 'Add a bottom navigation bar with custom links and icons to help users navigate your app.',
    plans: ['Basic', 'Pro', 'Business'],
  },
  {
    icon: Camera,
    title: 'Camera Access',
    desc: 'Full camera integration for photo uploads, video capture, and more.',
    plans: ['Free', 'Basic', 'Pro', 'Business'],
  },
  {
    icon: MapPin,
    title: 'Location Services',
    desc: 'GPS access for location-based features with proper permission handling.',
    plans: ['Basic', 'Pro', 'Business'],
  },
  {
    icon: Upload,
    title: 'File Upload',
    desc: 'Support for file uploads from the device including images, documents, and more.',
    plans: ['Free', 'Basic', 'Pro', 'Business'],
  },
  {
    icon: Code,
    title: 'JavaScript Bridge',
    desc: 'Communicate between your website and native app features. Access device info, share content, trigger vibration, and more.',
    plans: ['Pro', 'Business'],
  },
  {
    icon: Monitor,
    title: 'AdMob Integration',
    desc: 'Monetize your app with Google AdMob banner, interstitial, and rewarded ads.',
    plans: ['Basic', 'Pro', 'Business'],
  },
  {
    icon: Palette,
    title: 'Full Customization',
    desc: 'Custom colors, app icon, splash screen, status bar color, and user agent string.',
    plans: ['Free', 'Basic', 'Pro', 'Business'],
  },
]

export default function Features() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">All Features</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Everything you need to create professional Android and Windows desktop apps from your website.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allFeatures.map((f) => (
            <div key={f.title} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{f.desc}</p>
              <div className="flex flex-wrap gap-1">
                {f.plans.map((p) => (
                  <span key={p} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your App?</h2>
          <Link to="/register" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-gray-100">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
