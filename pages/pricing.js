import Link from 'next/link'
import { useState } from 'react'

export default function Pricing() {
  const [loading, setLoading] = useState('')

  const handleUpgrade = async (priceId, planName) => {
    setLoading(planName)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const { url, error } = await response.json()

      if (error) {
        console.error('Checkout error:', error)
        alert('Failed to start checkout. Please try again.')
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading('')
    }
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-secondary">
                Planning Radar
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/login" className="text-secondary-light hover:text-secondary px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </Link>
              <Link href="/signup" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-secondary sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-secondary-light max-w-3xl mx-auto">
            Choose the plan that works for your business. All plans include a 7-day free trial.
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Trial */}
          <div className="bg-card rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-secondary">Free Trial</h3>
              <p className="mt-4 text-secondary-light">Perfect for testing our service</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-secondary">£0</span>
                <span className="text-muted ml-1">for 7 days</span>
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Search by postcode or council</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>10 results per search</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Last 7 days of data</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Basic application info</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link href="/signup" className="w-full bg-gray-100 text-secondary block text-center py-3 px-4 rounded-md font-medium hover:bg-gray-200">
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-card rounded-lg shadow-lg border-2 border-accent p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-accent text-white px-4 py-2 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-semibold text-secondary">Pro</h3>
              <p className="mt-4 text-secondary-light">For growing property businesses</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-secondary">£49</span>
                <span className="text-muted ml-1">per month</span>
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Unlimited results</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>12 months historical data</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Keyword filters</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Full application detail</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>5 saved searches</span>
              </li>
            </ul>

            <div className="mt-8">
              <button
                onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro', 'pro')}
                disabled={loading === 'pro'}
                className="w-full bg-primary text-white py-3 px-4 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {loading === 'pro' ? 'Loading...' : 'Start Free Trial'}
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-card rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-secondary">Premium</h3>
              <p className="mt-4 text-secondary-light">For professional developers and agencies</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-secondary">£199</span>
                <span className="text-muted ml-1">per month</span>
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Unlimited historical data</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Unlimited saved searches</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>CSV export</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-3 mt-1">✓</span>
                <span>Applicant & agent search</span>
              </li>
            </ul>

            <div className="mt-8">
              <button
                onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_premium', 'premium')}
                disabled={loading === 'premium'}
                className="w-full bg-primary text-white py-3 px-4 rounded-md font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {loading === 'premium' ? 'Loading...' : 'Start Free Trial'}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-secondary mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-2">How does the free trial work?</h3>
                <p className="text-secondary-light">Start with a 7-day free trial on any plan. No credit card required. You can cancel anytime during the trial period.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-secondary mb-2">What data sources do you use?</h3>
                <p className="text-secondary-light">We pull data daily from the official UK Planning API (api.planning.org.uk) covering all local planning authorities across England and Wales.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Can I cancel anytime?</h3>
                <p className="text-secondary-light">Yes, you can cancel your subscription anytime. Your access will continue until the end of your current billing period.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Do you offer refunds?</h3>
                <p className="text-secondary-light">We offer a full refund within 14 days of your first payment if you&apos;re not satisfied with the service.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted">&copy; 2024 Planning Radar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}