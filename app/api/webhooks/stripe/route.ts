/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout completed:', session.id)

        // Get the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        // Map price ID to plan
        const priceId = subscription.items.data[0].price.id
        let plan = 'pro' // default

        // You'll need to set these based on your actual Stripe price IDs
        // For now, using a simple mapping - you should add your actual price IDs
        if (priceId.includes('premium')) plan = 'premium'

        // Update subscription in database
        await (supabase
          .from('subscriptions') as any)
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: null, // Clear trial
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.metadata?.userId)

        console.log(`Updated subscription for user ${session.metadata?.userId} to ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription updated:', subscription.id)

        // Map price ID to plan
        const priceId = subscription.items.data[0].price.id
        let plan = 'pro'
        if (priceId.includes('premium')) plan = 'premium'

        // Update subscription details
        await (supabase
          .from('subscriptions') as any)
          .update({
            plan,
            status: subscription.status === 'active' ? 'active' :
                   subscription.status === 'canceled' ? 'canceled' :
                   subscription.status === 'past_due' ? 'past_due' : 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`Updated subscription ${subscription.id} to ${plan}, status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription canceled:', subscription.id)

        // Set subscription to expired/canceled
        await (supabase
          .from('subscriptions') as any)
          .update({
            plan: 'expired',
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`Canceled subscription ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('Payment failed for subscription:', invoice.subscription)

        // Mark subscription as past due
        if (invoice.subscription) {
          await (supabase
            .from('subscriptions') as any)
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          console.log(`Marked subscription ${invoice.subscription} as past_due`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('Payment succeeded for subscription:', invoice.subscription)

        // Mark subscription as active if it was past due
        if (invoice.subscription) {
          await (supabase
            .from('subscriptions') as any)
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          console.log(`Reactivated subscription ${invoice.subscription}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({
      error: 'Webhook handler failed'
    }, { status: 500 })
  }
}