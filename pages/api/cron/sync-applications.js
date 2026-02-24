/**
 * Daily Cron Job: Sync Planning Applications
 * Fetches new applications from UK Planning API and updates database
 * Runs daily at 3 AM via Vercel Cron
 */

import { createServiceClient } from '../../../lib/supabase/pages-client'
import {
  fetchLPAs,
  searchApplications,
  mapApplicationToDatabase,
  getYesterday,
  formatDateForAPI
} from '../../../lib/planning-api'

export default async function handler(req, res) {
  // Verify this is a cron request
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createServiceClient()
  const startTime = new Date()
  let totalSynced = 0
  let totalErrors = 0
  const syncResults = []

  try {
    console.log('🚀 Starting daily planning applications sync...')

    // Check if we have a planning API key
    const planningApiKey = process.env.PLANNING_API_KEY
    if (!planningApiKey) {
      throw new Error('PLANNING_API_KEY not configured')
    }

    // Fetch all LPAs from the planning API
    console.log('📋 Fetching LPAs from Planning API...')
    const lpas = await fetchLPAs(planningApiKey)
    console.log(`📋 Found ${lpas.length} LPAs to sync`)

    // Process each LPA
    for (let i = 0; i < lpas.length; i++) {
      const lpa = lpas[i]

      try {
        console.log(`🏛️  Processing LPA ${i + 1}/${lpas.length}: ${lpa.name}`)

        // Check when this LPA was last synced
        const { data: lastSync } = await supabase
          .from('lpa_sync_log')
          .select('last_synced_at')
          .eq('lpa_id', lpa.id)
          .single()

        // Determine date range to sync
        let dateFrom
        if (lastSync?.last_synced_at) {
          const lastSyncDate = new Date(lastSync.last_synced_at)
          dateFrom = formatDateForAPI(lastSyncDate)
        } else {
          // First time syncing - get last 7 days
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          dateFrom = formatDateForAPI(weekAgo)
        }

        const dateTo = getYesterday()

        console.log(`📅 Syncing ${lpa.name} from ${dateFrom} to ${dateTo}`)

        // Search for applications
        const result = await searchApplications(
          planningApiKey,
          lpa.id,
          dateFrom,
          dateTo,
          true // return full data
        )

        console.log(`📊 Found ${result.applicationCount} applications for ${lpa.name}`)

        let syncedCount = 0
        let errorCount = 0

        // Process each application
        for (const apiApp of result.applications) {
          try {
            const dbApp = mapApplicationToDatabase(apiApp, lpa.id, lpa.name)

            // Upsert into database
            const { error } = await supabase
              .from('planning_applications')
              .upsert(dbApp, {
                onConflict: 'external_id',
                ignoreDuplicates: false
              })

            if (error) {
              console.error(`❌ Error upserting application ${dbApp.external_id}:`, error)
              errorCount++
            } else {
              syncedCount++
            }
          } catch (appError) {
            console.error(`❌ Error processing application:`, appError)
            errorCount++
          }
        }

        // Update sync log
        await supabase
          .from('lpa_sync_log')
          .upsert({
            lpa_id: lpa.id,
            lpa_name: lpa.name,
            last_synced_at: new Date().toISOString(),
            applications_fetched: result.applicationCount,
            status: errorCount > syncedCount ? 'partial_failure' : 'success'
          })

        syncResults.push({
          lpa: lpa.name,
          found: result.applicationCount,
          synced: syncedCount,
          errors: errorCount,
          status: 'success'
        })

        totalSynced += syncedCount
        totalErrors += errorCount

        console.log(`✅ ${lpa.name}: ${syncedCount} synced, ${errorCount} errors`)

        // Rate limiting - wait 500ms between LPA requests
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (lpaError) {
        console.error(`❌ Failed to sync LPA ${lpa.name}:`, lpaError)

        syncResults.push({
          lpa: lpa.name,
          found: 0,
          synced: 0,
          errors: 1,
          status: 'error',
          error: lpaError.message
        })

        totalErrors++

        // Log the failure
        await supabase
          .from('lpa_sync_log')
          .upsert({
            lpa_id: lpa.id,
            lpa_name: lpa.name,
            last_synced_at: new Date().toISOString(),
            applications_fetched: 0,
            status: 'error'
          })

        // Don't let one LPA failure stop the whole sync
        continue
      }
    }

    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    console.log(`🎉 Sync completed in ${duration}s`)
    console.log(`📊 Total: ${totalSynced} synced, ${totalErrors} errors`)

    return res.status(200).json({
      success: true,
      summary: {
        lpas_processed: lpas.length,
        total_synced: totalSynced,
        total_errors: totalErrors,
        duration_seconds: duration,
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString()
      },
      results: syncResults
    })

  } catch (error) {
    console.error('💥 Sync failed:', error)

    return res.status(500).json({
      success: false,
      error: error.message,
      summary: {
        total_synced: totalSynced,
        total_errors: totalErrors + 1,
        duration_seconds: (new Date() - startTime) / 1000
      }
    })
  }
}