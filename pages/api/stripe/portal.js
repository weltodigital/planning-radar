import { stripe, getURL } from '../../../lib/stripe-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { customerId } = req.body

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' })
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
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