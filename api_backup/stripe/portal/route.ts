/**
 * Stripe Customer Portal API
 * Creates portal sessions for subscription management
 */

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

    // Get user's subscription with Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!(subscription as any)?.stripe_customer_id) {
      return NextResponse.json({
        success: false,
        error: 'No Stripe customer found. Please subscribe first.'
      }, { status: 400 })
    }

    // Create Stripe Customer Portal Session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: (subscription as any).stripe_customer_id,
      return_url: `${baseUrl}/dashboard?portal=return`,
    })

    return NextResponse.json({
      success: true,
      data: {
        url: session.url
      },
      message: 'Portal session created successfully'
    })

  } catch (error) {
    console.error('Stripe portal error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to create portal session'
    }, { status: 500 })
  }
}