import { stripe, getURL } from '../../../lib/stripe-client'
import { createBrowserClient } from '../../../lib/supabase/pages-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { priceId } = req.body

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' })
    }

    // For now, we'll create checkout without user validation
    // In production, you should verify the user session here

    // Determine plan type from price ID
    let planType = 'pro'
    if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
      planType = 'premium'
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${getURL()}dashboard?upgrade=success`,
      cancel_url: `${getURL()}pricing?upgrade=cancelled`,
      metadata: {
        planType,
      },
      subscription_data: {
        metadata: {
          planType,
        },
      },
    })

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