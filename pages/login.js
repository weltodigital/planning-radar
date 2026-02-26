import Link from 'next/link'
import { useState } from 'react'
import { createBrowserClient } from '../lib/supabase/pages-client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsSuccess(false)

    try {
      const supabase = createBrowserClient()

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      setMessage('Check your email for the magic link!')
      setIsSuccess(true)
    } catch (error) {
      setMessage(error.message || 'Error sending magic link. Please try again.')
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-light">
            Or{' '}
            <Link href="/signup" className="font-medium text-primary hover:text-primary-dark">
              start your free trial
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted">
              We&apos;ll send you a magic link to sign in without a password
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}