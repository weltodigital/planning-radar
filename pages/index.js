import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Planning Radar</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Pricing
              </Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Track Every UK Planning Application
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Find development opportunities before your competitors. Search, filter, and monitor planning applications across the UK with real-time data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="text"
              placeholder="Enter postcode or area..."
              className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Link href="/signup" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Start Free Trial
            </Link>
          </div>
          <div className="flex justify-center mt-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
              Try Live Demo →
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-2">7-day free trial • No credit card required</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Three simple steps to find planning opportunities</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Search</h3>
            <p className="text-gray-600">Enter any UK postcode or council area to find planning applications</p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Filter</h3>
            <p className="text-gray-600">Use advanced filters to find exactly what you&apos;re looking for</p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Act</h3>
            <p className="text-gray-600">Export data, save searches, and track your opportunities</p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that works for your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4">Free Trial</h3>
              <div className="text-3xl font-bold mb-4">£0 <span className="text-sm font-normal text-gray-500">for 7 days</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Search by postcode or council</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>10 results per search</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Last 7 days of data</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Basic application info</li>
              </ul>
              <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-md font-medium">Current Plan</button>
            </div>

            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-4">Pro</h3>
              <div className="text-3xl font-bold mb-4">£49 <span className="text-sm font-normal text-gray-500">per month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Unlimited results</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>12 months historical data</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Keyword filters</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Full application detail</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>5 saved searches</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700">
                Start Free Trial
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4">Premium</h3>
              <div className="text-3xl font-bold mb-4">£199 <span className="text-sm font-normal text-gray-500">per month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Everything in Pro</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Unlimited historical data</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Unlimited saved searches</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>CSV export</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Applicant & agent search</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">&copy; 2024 Planning Radar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}