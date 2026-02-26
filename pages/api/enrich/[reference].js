/**
 * Application Enrichment API
 *
 * Provides enriched property intelligence data for individual planning applications.
 * Caches results for 7 days to avoid repeated expensive calculations.
 */

import { createClient } from '@supabase/supabase-js'
import { enrichApplication } from '../../../lib/enrich-application'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { reference } = req.query

  if (!reference) {
    return res.status(400).json({ error: 'Application reference required' })
  }

  try {
    // Check for cached enrichment data (valid for 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: cachedEnrichment } = await supabase
      .from('application_enrichment')
      .select('*')
      .eq('application_reference', reference)
      .gte('analyzed_at', sevenDaysAgo.toISOString())
      .single()

    if (cachedEnrichment) {
      console.log(`📋 Serving cached enrichment for ${reference}`)
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cachedEnrichment,
        cached_at: cachedEnrichment.analyzed_at
      })
    }

    // No recent cache, find the application and enrich it
    const { data: application } = await supabase
      .from('planning_applications')
      .select('external_id, address, postcode, lat, lng')
      .eq('external_id', reference)
      .single()

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    if (!application.postcode || !application.lat || !application.lng) {
      return res.status(400).json({
        error: 'Application missing location data required for enrichment',
        details: {
          has_postcode: !!application.postcode,
          has_coordinates: !!(application.lat && application.lng)
        }
      })
    }

    console.log(`🔍 Fresh enrichment required for ${reference}`)

    // Perform enrichment
    const enrichmentData = await enrichApplication({
      application_reference: reference,
      address: application.address,
      postcode: application.postcode,
      latitude: application.lat,
      longitude: application.lng
    })

    return res.status(200).json({
      success: true,
      source: 'fresh',
      data: enrichmentData,
      analyzed_at: enrichmentData.analyzed_at
    })

  } catch (error) {
    console.error(`❌ Enrichment failed for ${reference}:`, error.message)

    return res.status(500).json({
      success: false,
      error: 'Enrichment analysis failed',
      details: error.message,
      reference
    })
  }
}