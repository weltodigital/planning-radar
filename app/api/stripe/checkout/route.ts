/**
 * Stripe Checkout Session API
 * Creates checkout sessions for Pro and Premium subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({
        success: false,
        error: 'Price ID is required'
      }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get or create user subscription record
    let { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let stripeCustomerId = (subscription as any)?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Update subscription record with customer ID
      if (subscription) {
        await (supabase
          .from('subscriptions') as any)
          .update({
            stripe_customer_id: stripeCustomerId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } else {
        // Create subscription record if it doesn't exist
        await (supabase
          .from('subscriptions') as any)
          .insert({
            user_id: user.id,
            plan: 'free_trial',
            status: 'active',
            stripe_customer_id: stripeCustomerId,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?upgrade=success`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      },
      message: 'Checkout session created successfully'
    })

  } catch (error) {
    console.error('Stripe checkout error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to create checkout session'
    }, { status: 500 })
  }
}