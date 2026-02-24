import { stripe } from '../../../lib/stripe-client'
import { createServiceClient } from '../../../lib/supabase/pages-client'

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']

    let event
    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).json({ error: 'Webhook signature verification failed' })
    }

    const supabase = createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout completed:', session.id)

        // TODO: Update user subscription in database
        // For now, just log the event
        console.log('Plan type:', session.metadata?.planType)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id)

        // TODO: Update subscription status in database
        console.log('Subscription status:', subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)

        // TODO: Set user plan to expired in database
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Payment failed:', invoice.id)

        // TODO: Handle failed payment
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}