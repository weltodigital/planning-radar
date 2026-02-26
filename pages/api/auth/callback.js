import { createServiceClient } from '../../../lib/supabase/pages-client'

export default async function handler(req, res) {
  const { code } = req.query

  if (code) {
    const supabase = createServiceClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth error:', error)
        return res.redirect('/login?error=auth_error')
      }

      // Check if this is a new user by looking for existing subscription
      if (data?.user?.id) {
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        // If no subscription exists, create one for new user
        if (!existingSubscription) {
          const trialEndsAt = new Date()
          trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 day trial

          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: data.user.id,
              plan: 'free_trial',
              trial_ends_at: trialEndsAt.toISOString(),
              status: 'active'
            })

          if (subscriptionError) {
            console.error('Subscription creation error:', subscriptionError)
            // Don't block login if subscription creation fails
          }
        }
      }

      // Successful auth - redirect to dashboard
      return res.redirect('/dashboard')
    } catch (error) {
      console.error('Callback error:', error)
      return res.redirect('/login?error=callback_error')
    }
  }

  // No code provided
  return res.redirect('/login?error=no_code')
}