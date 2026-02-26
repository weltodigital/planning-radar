import { stripe, getURL } from '../../../lib/stripe-client'
import { createServiceClient } from '../../../lib/supabase/pages-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authenticated user from Supabase
    const supabase = createServiceClient()
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authorization' })
    }

    // Get user's Stripe customer ID from subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      return res.status(404).json({
        error: 'No subscription found. Please subscribe first to manage your billing.'
      })
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getURL()}dashboard`,
    })

    return res.status(200).json({
      url: session.url
    })

  } catch (error) {
    console.error('Customer portal error:', error)
    return res.status(500).json({
      error: 'Failed to create customer portal session',
      details: error.message
    })
  }
}