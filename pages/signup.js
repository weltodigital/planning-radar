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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              Planning Radar
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary">
            Start your free trial
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-light">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-primary">✓</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary">
                7-day free trial includes:
              </h3>
              <div className="mt-2 text-sm text-primary-light">
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
            <label htmlFor="email" className="block text-sm font-medium text-secondary">
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
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-secondary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-md ${isSuccess ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted">
              By signing up, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}