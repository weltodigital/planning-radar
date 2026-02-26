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
        console.log('Checkout completed:', session.id, 'Customer:', session.customer)

        try {
          // Get the subscription details from Stripe
          let subscription = null
          if (session.subscription) {
            subscription = await stripe.subscriptions.retrieve(session.subscription)
          }

          // Determine plan type from price ID
          let planType = 'free'
          if (subscription && subscription.items.data.length > 0) {
            const priceId = subscription.items.data[0].price.id
            if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              planType = 'pro'
            } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
              planType = 'premium'
            }
          }

          // Get user ID from metadata or customer email
          const userId = session.metadata?.userId
          if (!userId) {
            console.error('No userId in checkout session metadata')
            break
          }

          console.log('Processing checkout for user:', userId, 'plan:', planType)

          // Create or update subscription record
          const subscriptionData = {
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription?.id || null,
            plan: planType,
            status: subscription?.status || 'active',
            current_period_start: subscription?.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
            current_period_end: subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            trial_ends_at: subscription?.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          }

          // Upsert subscription (update if exists, insert if new)
          const { error } = await supabase
            .from('subscriptions')
            .upsert(subscriptionData, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            })

          if (error) {
            console.error('Error updating subscription:', error)
          } else {
            console.log('Successfully updated subscription for user:', userId)
          }

        } catch (error) {
          console.error('Error processing checkout.session.completed:', error)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status)

        try {
          // Determine plan type from price ID
          let planType = 'free'
          if (subscription.items.data.length > 0) {
            const priceId = subscription.items.data[0].price.id
            if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              planType = 'pro'
            } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
              planType = 'premium'
            }
          }

          // Update subscription record
          const { error } = await supabase
            .from('subscriptions')
            .update({
              plan: planType,
              status: subscription.status,
              current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
              current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error updating subscription:', error)
          } else {
            console.log('Successfully updated subscription:', subscription.id)
          }

        } catch (error) {
          console.error('Error processing customer.subscription.updated:', error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)

        try {
          // Set plan to free and status to cancelled
          const { error } = await supabase
            .from('subscriptions')
            .update({
              plan: 'free',
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error cancelling subscription:', error)
          } else {
            console.log('Successfully cancelled subscription:', subscription.id)
          }

        } catch (error) {
          console.error('Error processing customer.subscription.deleted:', error)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Payment succeeded:', invoice.id)

        try {
          // Update subscription with new period end date
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

            const { error } = await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', invoice.subscription)

            if (error) {
              console.error('Error updating subscription after payment:', error)
            } else {
              console.log('Successfully updated subscription after payment:', invoice.subscription)
            }
          }

        } catch (error) {
          console.error('Error processing invoice.payment_succeeded:', error)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Payment failed:', invoice.id)

        try {
          // Set subscription status to past_due
          if (invoice.subscription) {
            const { error } = await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', invoice.subscription)

            if (error) {
              console.error('Error updating subscription after payment failure:', error)
            } else {
              console.log('Successfully marked subscription as past_due:', invoice.subscription)
            }
          }

        } catch (error) {
          console.error('Error processing invoice.payment_failed:', error)
        }
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