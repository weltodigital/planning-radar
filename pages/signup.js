import Link from 'next/link'
import { useState } from 'react'
import { createBrowserClient } from '../lib/supabase/pages-client'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsSuccess(false)

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36), // Random password since we're using magic links
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      setMessage('Account created! Check your email for the magic link.')
      setIsSuccess(true)
    } catch (error) {
      setMessage(error.message || 'Error creating account. Please try again.')
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Planning Radar
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Start your free trial
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-500">✓</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                7-day free trial includes:
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-none space-y-1">
                  <li>• Search by postcode or council</li>
                  <li>• 10 results per search</li>
                  <li>• Last 7 days of planning data</li>
                  <li>• No credit card required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-md ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              By signing up, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}