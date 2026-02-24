import { Metadata } from 'next'
// Production homepage

export const metadata: Metadata = {
  title: 'Planning Radar | Track Every UK Planning Application',
  description: 'Get ahead with real-time UK planning application intelligence.',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Track Every UK Planning Application
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get ahead with real-time planning application intelligence from 268+ councils.
          </p>
          <div className="space-x-4">
            <a
              href="/signup"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Start Free Trial
            </a>
            <a
              href="/pricing"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 font-semibold"
            >
              View Pricing
            </a>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose Planning Radar?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Search</h3>
              <p className="text-gray-600">
                Search planning applications across 268+ UK councils with powerful filters.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
              <p className="text-gray-600">
                Get the latest planning applications as soon as they're published.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">💼</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
              <p className="text-gray-600">
                Export data, track competitors, and never miss an opportunity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}