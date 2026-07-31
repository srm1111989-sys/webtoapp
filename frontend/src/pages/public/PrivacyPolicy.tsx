import { Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'

export default function PrivacyPolicy() {
  useSEO({ title: 'Privacy Policy', canonical: 'https://websitetoapp.app/privacy-policy' })
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: February 22, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
          <p>
            WebsiteToApp ("we", "our", or "us") operates the website{' '}
            <a href="https://websitetoapp.app" className="text-blue-600 hover:underline">websitetoapp.app</a>.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you visit our website and use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
          <p>When you create an account or use our services, we may collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name and email address</li>
            <li>Phone number (optional)</li>
            <li>Payment and billing information (processed securely via Razorpay)</li>
            <li>Website URL provided for app conversion</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address and browser type</li>
            <li>Device information and operating system</li>
            <li>Usage data (pages visited, time spent, clicks)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain our services</li>
            <li>To process your orders and payments</li>
            <li>To build and deliver your apps (Android APK, AAB, Windows .exe)</li>
            <li>To send you order updates and build status notifications</li>
            <li>To respond to your support requests</li>
            <li>To improve our platform and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Payment Processing</h2>
          <p>
            All payments are processed securely through <strong>Razorpay</strong>, a PCI-DSS compliant
            payment gateway. We do not store your credit/debit card details on our servers.
            Payment data is handled directly by Razorpay in accordance with their{' '}
            <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              privacy policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
          <p>We do not sell your personal information. We may share your data with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Payment processors</strong> (Razorpay) to process transactions</li>
            <li><strong>Cloud service providers</strong> to host and deliver our services</li>
            <li><strong>Law enforcement</strong> if required by law or legal proceedings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
          <p>
            We implement industry-standard security measures including SSL encryption,
            secure authentication, and regular security updates to protect your data.
            However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
          <p>
            We use cookies to maintain your session, remember your preferences, and
            improve our service. You can control cookie settings through your browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you
            of any changes by posting the new policy on this page and updating the
            "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:support@websitetoapp.app" className="text-blue-600 hover:underline">
              support@websitetoapp.app
            </a>{' '}
            or visit our <Link to="/contact" className="text-blue-600 hover:underline">Contact page</Link>.
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900">Stark Enterprises</p>
          </div>
        </section>
      </div>
    </div>
  )
}
