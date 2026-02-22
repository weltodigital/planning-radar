'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function SignUpForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [step, setStep] = useState<'email' | 'payment'>('email')
  const router = useRouter()

  const supabase = createClient()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // First, sign up the user with Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?signup=true&next=/signup/payment`,
          data: {
            signup: true
          }
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setStep('payment')
        setMessage('Please add your payment method below to start your free trial.')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Create setup intent
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!data.success) {
        setMessage(data.error || 'Failed to initialize payment setup')
        setLoading(false)
        return
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setMessage('Card element not found')
        setLoading(false)
        return
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(data.data.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
          },
        },
      })

      if (error) {
        setMessage(`Payment setup failed: ${error.message}`)
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        // Send the magic link after successful payment setup
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?welcome=true`,
          },
        })

        setMessage('Success! Check your email for the magic link to complete your signup!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">PR</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Planning Radar</h1>
          <p className="text-slate-600">Start your free 7-day trial</p>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-200/50 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-indigo-900 text-lg mb-3">✨ Free Trial Includes:</h3>
          <ul className="text-indigo-800 text-sm space-y-2">
            <li>• Browse up to 10 recent applications</li>
            <li>• Search by council or postcode</li>
            <li>• 7 days of planning activity</li>
            <li>• Cancel anytime during trial</li>
          </ul>
          <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
            <p className="text-amber-800 text-sm font-medium">
              💳 Credit card required to start trial. You won't be charged until your trial ends.
            </p>
          </div>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5"
            >
              {loading ? 'Creating account...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Credit Card Information
              </label>
              <div className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-200">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#334155',
                        fontFamily: 'system-ui, sans-serif',
                        '::placeholder': {
                          color: '#64748b',
                        },
                      },
                    },
                    hidePostalCode: false,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !stripe}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5"
              >
                {loading ? 'Processing...' : 'Start free trial'}
              </button>
            </div>
          </form>
        )}

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${
            message.includes('Error')
              ? 'bg-red-50/50 text-red-800 border border-red-200/50'
              : 'bg-emerald-50/50 text-emerald-800 border border-emerald-200/50'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Sign in
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← Back to home
          </a>
        </div>

        <div className="mt-6 text-xs text-slate-500 text-center">
          By signing up, you agree to our terms of service and privacy policy.
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Elements stripe={stripePromise}>
      <SignUpForm />
    </Elements>
  )
}