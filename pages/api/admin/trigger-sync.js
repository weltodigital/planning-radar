/**
 * Manual Sync Trigger
 * Allows manual triggering of planning application sync for testing
 * Protected with admin secret
 */

import { createServiceClient } from '../../../lib/supabase/pages-client'
import {
  fetchLPAs,
  searchApplications,
  mapApplicationToDatabase,
  getInitialSyncDateRange,
  formatDateForAPI
} from '../../../lib/planning-api'

export default async function handler(req, res) {
  // Verify admin access
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'admin-secret-change-in-production'}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createServiceClient()
  const startTime = new Date()

  // Get options from request body
  const {
    lpaLimit = 5, // Limit LPAs for testing
    testMode = true // Use smaller date range for testing
  } = req.body

  let totalSynced = 0
  let totalErrors = 0
  const syncResults = []

  try {
    console.log('🧪 Starting manual planning applications sync...')

    // Check if we have a planning API key
    const planningApiKey = process.env.PLANNING_API_KEY
    if (!planningApiKey) {
      throw new Error('PLANNING_API_KEY not configured')
    }

    // Fetch all LPAs from the planning API
    console.log('📋 Fetching LPAs from Planning API...')
    const allLpas = await fetchLPAs(planningApiKey)

    // Limit LPAs for testing
    const lpas = allLpas.slice(0, lpaLimit)
    console.log(`📋 Processing ${lpas.length} LPAs (limited from ${allLpas.length} total)`)

    // Process each LPA
    for (let i = 0; i < lpas.length; i++) {
      const lpa = lpas[i]

      try {
        console.log(`🏛️  Processing LPA ${i + 1}/${lpas.length}: ${lpa.name}`)

        // Determine date range
        let dateRange
        if (testMode) {
          // Use smaller range for testing
          dateRange = getInitialSyncDateRange() // Last 7 days
        } else {
          // Check last sync for full sync
          const { data: lastSync } = await supabase
            .from('lpa_sync_log')
            .select('last_synced_at')
            .eq('lpa_id', lpa.id)
            .single()

          if (lastSync?.last_synced_at) {
            const lastSyncDate = new Date(lastSync.last_synced_at)
            const today = new Date()
            dateRange = {
              from: formatDateForAPI(lastSyncDate),
              to: formatDateForAPI(today)
            }
          } else {
            dateRange = getInitialSyncDateRange()
          }
        }

        console.log(`📅 Syncing ${lpa.name} from ${dateRange.from} to ${dateRange.to}`)

        // Search for applications
        const result = await searchApplications(
          planningApiKey,
          lpa.id,
          dateRange.from,
          dateRange.to,
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

        // Rate limiting - wait 1 second between requests for manual testing
        await new Promise(resolve => setTimeout(resolve, 1000))

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
      }
    }

    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    console.log(`🎉 Manual sync completed in ${duration}s`)
    console.log(`📊 Total: ${totalSynced} synced, ${totalErrors} errors`)

    return res.status(200).json({
      success: true,
      mode: testMode ? 'test' : 'full',
      summary: {
        lpas_processed: lpas.length,
        lpas_total: allLpas.length,
        total_synced: totalSynced,
        total_errors: totalErrors,
        duration_seconds: Math.round(duration),
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString()
      },
      results: syncResults
    })

  } catch (error) {
    console.error('💥 Manual sync failed:', error)

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