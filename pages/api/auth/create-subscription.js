import { createServiceClient } from '../../../lib/supabase/pages-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
  }

  try {
    const supabase = createServiceClient()

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

    // If no subscription exists, create one for new user
    if (!existingSubscription) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 day trial

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free_trial',
          trial_ends_at: trialEndsAt.toISOString(),
          status: 'active'
        })

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError)
        return res.status(500).json({ error: 'Failed to create subscription' })
      }

      return res.status(200).json({ message: 'Subscription created successfully', created: true })
    }

    return res.status(200).json({ message: 'Subscription already exists', created: false })

  } catch (error) {
    console.error('Create subscription error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}