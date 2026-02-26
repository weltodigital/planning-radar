/**
 * Property Comparables API
 *
 * Provides comparable property sales data from Land Registry
 * for market analysis and valuation insights.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase client with service role for RPC calls
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    postcode,
    type = null,
    months = '24',
    limit = '10'
  } = req.query

  if (!postcode) {
    return res.status(400).json({ error: 'Postcode parameter is required' })
  }

  // Validate and parse parameters
  const monthsBack = Math.min(Math.max(parseInt(months) || 24, 1), 120) // 1-120 months
  const maxResults = Math.min(Math.max(parseInt(limit) || 10, 1), 100) // 1-100 results

  try {
    console.log(`🏠 Finding comparables for ${postcode} (${monthsBack} months, ${maxResults} results)`)

    // Call the SQL function to get comparables
    const { data: comparables, error } = await supabase
      .rpc('get_comparables', {
        target_postcode: postcode.toUpperCase().replace(/\s+/g, ' ').trim(),
        property_type_filter: type,
        months_back: monthsBack,
        max_results: maxResults * 2 // Get more to allow for filtering
      })

    if (error) {
      console.error('Comparables query failed:', error.message)
      return res.status(500).json({
        error: 'Database query failed',
        details: error.message
      })
    }

    if (!comparables || comparables.length === 0) {
      return res.status(200).json({
        success: true,
        postcode,
        summary: {
          count: 0,
          average: null,
          median: null,
          min: null,
          max: null
        },
        sales: [],
        filters: {
          months_back: monthsBack,
          property_type: type,
          limit: maxResults
        }
      })
    }

    // Calculate summary statistics
    const prices = comparables.map(c => c.price).filter(p => p > 0)
    const summary = {
      count: prices.length,
      average: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      median: prices.length > 0 ? calculateMedian(prices) : null,
      min: prices.length > 0 ? Math.min(...prices) : null,
      max: prices.length > 0 ? Math.max(...prices) : null
    }

    // Format sales data
    const sales = comparables
      .slice(0, maxResults) // Apply limit
      .map(sale => ({
        transaction_id: sale.transaction_id,
        price: sale.price,
        date_of_transfer: sale.date_of_transfer,
        postcode: sale.postcode,
        address: formatAddress(sale),
        property_type: sale.property_type,
        old_new: sale.old_new,
        distance_metres: Math.round(sale.distance_metres || 0),
        months_ago: Math.round(sale.months_ago || 0)
      }))

    return res.status(200).json({
      success: true,
      postcode,
      summary,
      sales,
      filters: {
        months_back: monthsBack,
        property_type: type,
        limit: maxResults
      },
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error(`❌ Comparables API failed for ${postcode}:`, error.message)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch comparable sales',
      details: error.message,
      postcode
    })
  }
}

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(numbers) {
  if (numbers.length === 0) return null

  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

/**
 * Format address from Land Registry components
 */
function formatAddress(sale) {
  const parts = []

  if (sale.paon) parts.push(sale.paon) // Primary address (house number)
  if (sale.saon) parts.push(sale.saon) // Secondary address (flat number)
  if (sale.street) parts.push(sale.street)
  if (sale.locality) parts.push(sale.locality)
  if (sale.town && sale.town !== sale.locality) parts.push(sale.town)

  return parts.filter(Boolean).join(', ') || 'Address not available'
}