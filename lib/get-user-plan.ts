import { Plan } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import { isTrialExpired } from '@/lib/plans'

export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const supabase = await createClient()

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !subscription) {
      // No subscription found, return expired
      return 'expired'
    }

    // Check if it's a free trial and if it has expired
    if (subscription.plan === 'free_trial') {
      if (isTrialExpired(subscription.trial_ends_at)) {
        return 'expired'
      }
      return 'free_trial'
    }

    // Check if the subscription is active
    if (subscription.status === 'active') {
      return subscription.plan as Plan
    }

    // Any other status (canceled, past_due, etc.) is considered expired
    return 'expired'
  } catch (error) {
    console.error('Error getting user plan:', error)
    return 'expired'
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const supabase = await createClient()

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !subscription) {
      return null
    }

    return subscription
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return null
  }
}

export async function createTrialSubscription(userId: string) {
  try {
    const supabase = await createClient()

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'free_trial',
        trial_ends_at: trialEndDate.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating trial subscription:', error)
    throw error
  }
}