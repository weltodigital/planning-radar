#!/usr/bin/env node

/**
 * Test script for Planning Radar API connections
 * Run with: node scripts/test-apis.js
 */

require('dotenv').config({ path: '.env.local' })

async function testSupabase() {
  console.log('\n🔧 Testing Supabase Connection...')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL not set')
    return false
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not set')
    return false
  }

  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('planning_applications')
      .select('count')
      .limit(1)

    if (error) {
      console.log(`❌ Supabase error: ${error.message}`)
      return false
    }

    console.log('✅ Supabase connection successful!')
    return true
  } catch (err) {
    console.log(`❌ Supabase connection failed: ${err.message}`)
    return false
  }
}

async function testStripe() {
  console.log('\n💳 Testing Stripe Connection...')

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY not set')
    return false
  }

  try {
    const Stripe = require('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const account = await stripe.accounts.retrieve()
    console.log(`✅ Stripe connected! Account: ${account.id}`)

    if (process.env.STRIPE_PRO_PRICE_ID) {
      const proPrice = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_ID)
      console.log(`✅ Pro price found: ${proPrice.nickname || proPrice.id}`)
    } else {
      console.log('⚠️  STRIPE_PRO_PRICE_ID not set')
    }

    if (process.env.STRIPE_PREMIUM_PRICE_ID) {
      const premiumPrice = await stripe.prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID)
      console.log(`✅ Premium price found: ${premiumPrice.nickname || premiumPrice.id}`)
    } else {
      console.log('⚠️  STRIPE_PREMIUM_PRICE_ID not set')
    }

    return true
  } catch (err) {
    console.log(`❌ Stripe connection failed: ${err.message}`)
    return false
  }
}

async function testPlanningAPI() {
  console.log('\n🏗️  Testing Planning API...')

  if (!process.env.PLANNING_API_KEY) {
    console.log('❌ PLANNING_API_KEY not set')
    return false
  }

  try {
    const response = await fetch(`https://api.planning.org.uk/v1/lpas?key=${process.env.PLANNING_API_KEY}`)

    if (!response.ok) {
      console.log(`❌ Planning API error: ${response.status} ${response.statusText}`)
      return false
    }

    const data = await response.json()

    if (data.response?.status === 'OK') {
      const lpaCount = data.response.lpa_count || 0
      console.log(`✅ Planning API connected! Found ${lpaCount} LPAs`)

      // Test a search query (free, no credits used)
      const searchResponse = await fetch(
        `https://api.planning.org.uk/v1/search?key=${process.env.PLANNING_API_KEY}&lpa_id=bristol&date_from=2024-01-01&date_to=2024-01-07`
      )

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        const appCount = searchData.response?.application_count || 0
        console.log(`✅ Search test successful! Found ${appCount} applications`)
      }

      return true
    } else {
      console.log(`❌ Planning API returned: ${data.response?.status || 'Unknown error'}`)
      return false
    }
  } catch (err) {
    console.log(`❌ Planning API connection failed: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Planning Radar - API Connection Test')
  console.log('=====================================')

  const results = {
    supabase: await testSupabase(),
    stripe: await testStripe(),
    planningAPI: await testPlanningAPI(),
  }

  console.log('\n📊 Summary:')
  console.log('===========')
  console.log(`Supabase: ${results.supabase ? '✅ Connected' : '❌ Failed'}`)
  console.log(`Stripe: ${results.stripe ? '✅ Connected' : '❌ Failed'}`)
  console.log(`Planning API: ${results.planningAPI ? '✅ Connected' : '❌ Failed'}`)

  const allConnected = Object.values(results).every(result => result === true)

  if (allConnected) {
    console.log('\n🎉 All APIs connected successfully!')
    console.log('Ready to proceed with Phase 3: Data Pipeline!')
  } else {
    console.log('\n⚠️  Some connections failed. Please check your API keys.')
    console.log('See API_KEYS_SETUP.md for setup instructions.')
  }

  process.exit(allConnected ? 0 : 1)
}

main().catch(console.error)