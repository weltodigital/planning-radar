import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createBrowserClient } from '../../lib/supabase/pages-client'

// Function to check and create subscription for new users
async function checkAndCreateSubscription(userId) {
  try {
    const response = await fetch('/api/auth/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      console.error('Failed to check/create subscription')
    }
  } catch (error) {
    console.error('Error checking subscription:', error)
    // Don't block auth flow if subscription creation fails
  }
}

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserClient()

        // Handle hash-based auth (magic links)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          setError('Authentication failed. Please try again.')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (data.session) {
          // We have a valid session, check if we need to create subscription
          await checkAndCreateSubscription(data.session.user.id)
          router.push('/dashboard')
          return
        }

        // If no session, try to get it from URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
        const code = queryParams.get('code')
        const tokenHash = hashParams.get('token_hash')
        const type = hashParams.get('type') || queryParams.get('type')

        // Log what we're getting for debugging
        console.log('Auth callback params:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          code: !!code,
          tokenHash: !!tokenHash,
          type,
          hash: window.location.hash,
          search: window.location.search
        })

        if (accessToken && refreshToken) {
          // Set session from tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Set session error:', error)
            setError('Authentication failed. Please try again.')
            setTimeout(() => router.push('/login'), 3000)
            return
          }

          // Check if we need to create subscription for this user
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData.session) {
            await checkAndCreateSubscription(sessionData.session.user.id)
          }

          router.push('/dashboard')
        } else if (code) {
          // Try exchange code for session
          const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('Exchange code error:', error)
            setError('Authentication failed. Please try again.')
            setTimeout(() => router.push('/login'), 3000)
            return
          }

          // Check if we need to create subscription for this user
          if (sessionData.session) {
            await checkAndCreateSubscription(sessionData.session.user.id)
          }

          router.push('/dashboard')
        } else {
          console.log('No valid auth parameters found')
          setError('No authentication information provided.')
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