import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createBrowserClient } from '../../lib/supabase/pages-client'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserClient()

        // Get the code from URL parameters
        const { code } = router.query

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            setError('Authentication failed. Please try again.')
            setTimeout(() => router.push('/login'), 3000)
            return
          }

          // Success - redirect to dashboard
          router.push('/dashboard')
        } else {
          setError('No authentication code provided.')
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError('Something went wrong. Please try again.')
        setTimeout(() => router.push('/login'), 3000)
      } finally {
        setLoading(false)
      }
    }

    if (router.isReady) {
      handleAuthCallback()
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        {loading ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
            <p className="text-gray-600">Please wait while we authenticate your account.</p>
          </div>
        ) : error ? (
          <div>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        ) : (
          <div>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}