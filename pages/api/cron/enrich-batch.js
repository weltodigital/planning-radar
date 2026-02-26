/**
 * Batch Enrichment Cron Job
 *
 * Automatically enriches new planning applications with property intelligence data.
 * Runs every 4 hours to keep enrichment data current without overwhelming the system.
 */

import { batchEnrichNewApplications } from '../../../lib/enrich-application'

export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = new Date()
  console.log('🔄 Starting batch enrichment cron job...')

  try {
    // Process up to 50 applications per run
    const batchSize = req.body?.limit || 50

    const result = await batchEnrichNewApplications(batchSize)

    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    console.log('✅ Batch enrichment cron completed')
    console.log(`📊 Results: ${result.enriched} enriched, ${result.errors} errors in ${duration.toFixed(1)}s`)

    return res.status(200).json({
      success: true,
      message: 'Batch enrichment completed',
      summary: {
        batch_size: batchSize,
        enriched: result.enriched,
        errors: result.errors,
        duration_seconds: Math.round(duration),
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString()
      }
    })

  } catch (error) {
    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    console.error('❌ Batch enrichment cron failed:', error.message)

    return res.status(500).json({
      success: false,
      error: 'Batch enrichment failed',
      details: error.message,
      duration_seconds: Math.round(duration),
      started_at: startTime.toISOString(),
      failed_at: endTime.toISOString()
    })
  }
}