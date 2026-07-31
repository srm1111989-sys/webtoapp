import { Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'

export default function TermsOfService() {
  useSEO({ title: 'Terms of Service', canonical: 'https://websitetoapp.app/terms' })
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: February 22, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using WebsiteToApp (<a href="https://websitetoapp.app" className="text-blue-600 hover:underline">websitetoapp.app</a>),
            you agree to be bound by these Terms of Service. If you do not agree, please
            do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
          <p>
            WebsiteToApp provides a platform to convert websites into Android mobile apps
            and Windows desktop applications. Our service includes:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Web-based configuration wizard</li>
            <li>Automated app building via CI/CD pipeline</li>
            <li>APK, AAB (App Bundle), and .exe builds</li>
            <li>Feature integration (push notifications, analytics, etc.)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must provide accurate and complete registration information</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One person or legal entity may not maintain more than one free account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pricing & Payments</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Prices are displayed in INR or USD based on your location</li>
            <li>All payments are processed securely through Razorpay</li>
            <li>One-time plans grant lifetime access to the purchased features for that app</li>
            <li>Monthly plans are billed recurring until cancelled</li>
            <li>Prices may change with prior notice; existing subscriptions are honoured</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Refund Policy</h2>
          <p>
            Please refer to our <Link to="/refund-policy" className="text-blue-600 hover:underline">Refund Policy</Link> page
            for detailed information about refunds, cancellations, and dispute resolution.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Acceptable Use</h2>
          <p>You agree not to use our service to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Convert websites you do not own or have permission to convert</li>
            <li>Create apps that contain malware, spyware, or malicious code</li>
            <li>Create apps that infringe on intellectual property rights</li>
            <li>Create apps that contain illegal, harmful, or offensive content</li>
            <li>Attempt to reverse-engineer, decompile, or hack our platform</li>
            <li>Resell or redistribute our service without authorization</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You retain ownership of your website content and branding</li>
            <li>Apps generated with the Free plan include "Powered by WebsiteToApp" branding</li>
            <li>Paid plans (Basic and above) remove all WebsiteToApp branding</li>
            <li>The WebsiteToApp platform, code, and brand remain our intellectual property</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Service Availability</h2>
          <p>
            We strive for maximum uptime but do not guarantee uninterrupted service.
            We may perform maintenance, updates, or experience downtime. We are not
            liable for any losses resulting from service interruptions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p>
            WebsiteToApp is provided "as is" without warranties of any kind. We are not
            liable for any indirect, incidental, or consequential damages arising
            from your use of the service. Our total liability shall not exceed the
            amount paid by you in the preceding 12 months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these terms.
            You may delete your account at any time. Upon termination, your right
            to use the service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with
            the laws of India. Any disputes shall be subject to the exclusive
            jurisdiction of courts in India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:support@websitetoapp.app" className="text-blue-600 hover:underline">
              support@websitetoapp.app
            </a>.
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900">Stark Enterprises</p>
          </div>
        </section>
      </div>
    </div>
  )
}
