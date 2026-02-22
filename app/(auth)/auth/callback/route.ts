import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const signup = searchParams.get('signup') === 'true'
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Auth callback error:', sessionError)
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
    }

    // If this is a signup, create subscription record
    if (signup && sessionData.user) {
      try {
        const { error: subscriptionError } = await (supabase
          .from('subscriptions') as any)
          .insert({
            user_id: sessionData.user.id,
            plan: 'free_trial',
            status: 'active',
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (subscriptionError) {
          console.error('Failed to create subscription:', subscriptionError)
          // Don't fail the auth flow, but log the error
        } else {
          console.log('Created free trial subscription for user:', sessionData.user.id)
        }
      } catch (error) {
        console.error('Subscription creation error:', error)
        // Don't fail the auth flow
      }
    }

    // Redirect to dashboard or specified next URL
    const redirectUrl = signup ? '/dashboard?welcome=true' : next
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Return the user to the login page if no code is provided
  return NextResponse.redirect(new URL('/login?error=no_code', request.url))
}