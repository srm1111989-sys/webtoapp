import { Mail, MessageSquare } from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'

export default function Contact() {
  useSEO({ title: 'Contact Us', description: 'Get in touch with WebToApp for support, refunds, or business inquiries.' })
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-8">We'd love to hear from you. Reach out for support, feedback, or business inquiries.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
            <p className="text-gray-600 text-sm mb-3">
              For general inquiries, refund requests, and technical support.
            </p>
            <a
              href="mailto:support@websitetoapp.app"
              className="text-blue-600 hover:underline font-medium"
            >
              support@websitetoapp.app
            </a>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Business Inquiries</h3>
            <p className="text-gray-600 text-sm mb-3">
              For partnerships, bulk plans, and enterprise solutions.
            </p>
            <a
              href="mailto:business@websitetoapp.app"
              className="text-blue-600 hover:underline font-medium"
            >
              business@websitetoapp.app
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white border rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Needed</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="/refund-policy" className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Refund & Cancellation</h3>
            <p className="text-gray-500 text-sm">View our refund policy and how to request one</p>
          </a>
          <a href="/privacy-policy" className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Privacy Policy</h3>
            <p className="text-gray-500 text-sm">Learn how we handle your data</p>
          </a>
          <a href="/terms" className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Terms of Service</h3>
            <p className="text-gray-500 text-sm">Read our terms and conditions</p>
          </a>
          <a href="/pricing" className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Pricing</h3>
            <p className="text-gray-500 text-sm">View plans and pricing details</p>
          </a>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Response time: Usually within 24 hours on business days.</p>
      </div>
    </div>
  )
}
