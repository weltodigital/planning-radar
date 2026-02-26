import { stripe, getURL } from '../../../lib/stripe-client'
import { createServiceClient } from '../../../lib/supabase/pages-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { priceId } = req.body

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' })
    }

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

    // Determine plan type from price ID
    let planType = 'pro'
    if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
      planType = 'premium'
    }

    // Check if user already has a Stripe customer ID
    let customerId = null
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    }

    // Create Stripe Checkout Session
    const sessionData = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${getURL()}dashboard?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
      cancel_url: `${getURL()}pricing?upgrade=cancelled`,
      customer_email: user.email,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        plan: planType,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: planType,
        },
      },
    }

    // If user has existing customer ID, use it instead of email
    if (customerId) {
      sessionData.customer = customerId
      delete sessionData.customer_email
    }

    const session = await stripe.checkout.sessions.create(sessionData)

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    })
  }
}