'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingPlan {
  id: string
  name: string
  price: string
  priceId?: string
  description: string
  features: string[]
  buttonText: string
  buttonStyle: string
  popular?: boolean
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const plans: PricingPlan[] = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '£0',
      description: 'Perfect for exploring planning applications',
      features: [
        '10 search results',
        '7 days of planning history',
        'Basic council search',
        'Postcode radius search',
        'Planning activity dashboard',
        'Cancel anytime during trial'
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'bg-gray-600 hover:bg-gray-700 text-white'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '£49',
      priceId: 'price_1T2DiPKC14Kid1sqwgYeMG6F',
      description: 'For professionals tracking planning opportunities',
      features: [
        'Unlimited search results',
        '1 year planning history',
        'Advanced keyword search',
        'Full application details',
        'Save up to 5 searches',
        'Email support',
        'API access'
      ],
      buttonText: 'Upgrade to Pro',
      buttonStyle: 'bg-primary hover:bg-primary/90 text-white',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '£199',
      priceId: 'price_1T2DilKC14Kid1sqZ8UJbGTp',
      description: 'For teams and advanced users',
      features: [
        'Everything in Pro',
        'Full planning history',
        'Applicant & agent search',
        'CSV data export (10K rows)',
        'Unlimited saved searches',
        'Priority support',
        'Custom integrations',
        'Bulk data access'
      ],
      buttonText: 'Upgrade to Premium',
      buttonStyle: 'bg-purple-600 hover:bg-purple-700 text-white'
    }
  ]

  const handlePlanSelect = async (plan: PricingPlan) => {
    if (plan.id === 'trial') {
      router.push('/signup')
      return
    }

    if (!plan.priceId) {
      alert('This plan is not yet available. Please contact support.')
      return
    }

    setLoading(plan.id)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url
      } else {
        if (response.status === 401) {
          // User not authenticated, redirect to login
          router.push(`/login?next=${encodeURIComponent('/pricing')}`)
        } else {
          alert(data.error || 'Failed to create checkout session')
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Planning Radar</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Features</a>
              <a href="/pricing" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Pricing</a>
              <a href="/api-demo" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">API</a>
              <a href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Sign In</a>
              <a
                href="/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
              >
                Start Free Trial
              </a>
            </div>
            <div className="md:hidden">
              <button className="text-slate-600 hover:text-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
            💼 Simple Pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Choose Your
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
            Start with a <strong className="font-semibold text-slate-800">free 7-day trial</strong>, then choose the plan that fits your business needs.
            All plans include live UK planning data from <strong className="font-semibold text-slate-800">268+ councils</strong>.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                plan.popular ? 'border-2 border-indigo-200 shadow-2xl hover:shadow-3xl' : 'border border-white/60'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                  {plan.price !== '£0' && <span className="text-slate-600 ml-2 text-lg font-medium">/month</span>}
                </div>
                <p className="text-slate-600 text-lg">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={loading === plan.id}
                className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:transform-none ${
                  plan.id === 'trial' ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-lg' :
                  plan.id === 'pro' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/25' :
                  'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                {loading === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Loading...
                  </div>
                ) : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold mb-6">
              ❓ Got Questions?
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Frequently Asked
              <span className="block bg-gradient-to-r from-slate-600 to-slate-900 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                What planning data do you include?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                We track planning applications from over 268 UK councils including all major cities
                and districts. Data includes application details, addresses, applicants, decisions,
                and status updates.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                How often is the data updated?
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Planning data is updated daily from official council sources. New applications
                typically appear within 24-48 hours of being validated by councils.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Yes, you can cancel your subscription anytime from your dashboard. You'll continue
                to have access until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                Do you offer annual plans?
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Annual plans with significant discounts are available. Contact our support team
                for custom pricing and enterprise options.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-gray-600 text-lg">
            Questions about pricing?
            <a href="mailto:support@planningradar.com" className="text-blue-600 hover:text-blue-700 font-semibold ml-2 transition-colors duration-200">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}