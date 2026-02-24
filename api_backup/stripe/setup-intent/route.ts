import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { email } = await request.json()

    // Create or retrieve Stripe customer
    let customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if ((subscription as any)?.stripe_customer_id) {
      // Retrieve existing customer
      customer = await stripe.customers.retrieve((subscription as any).stripe_customer_id)
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: email || user.email,
        metadata: {
          user_id: user.id
        }
      })

      // Store customer ID in subscription
      await (supabase
        .from('subscriptions') as any)
        .upsert({
          user_id: user.id,
          stripe_customer_id: customer.id,
          plan: 'free_trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'trialing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Create setup intent for future payments
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        user_id: user.id,
        type: 'trial_signup'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        client_secret: setupIntent.client_secret,
        customer_id: customer.id
      }
    })

  } catch (error) {
    console.error('Setup intent creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create setup intent'
    }, { status: 500 })
  }
}