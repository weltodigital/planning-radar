/**
 * Daily Cron Job: Sync Planning Applications
 * Fetches new applications from Planning London Datahub and updates database
 * Runs daily at 3 AM via Vercel Cron
 */

import { createServiceClient } from '../../../lib/supabase/pages-client'
import {
  getLondonBoroughs,
  getAllApplicationsForBorough,
  mapApplicationToDatabase,
  getInitialSyncDateRange,
  formatDateForAPI
} from '../../../lib/planning-london-api'

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
    console.log('🏙️ Starting daily London planning applications sync...')

    // Get all London boroughs
    const allBoroughs = getLondonBoroughs()
    console.log(`🏛️ Found ${allBoroughs.length} London boroughs to sync`)

    // Process each borough
    for (let i = 0; i < allBoroughs.length; i++) {
      const borough = allBoroughs[i]

      try {
        console.log(`🏙️ Processing borough ${i + 1}/${allBoroughs.length}: ${borough.name}`)

        // Check when this borough was last synced
        const { data: lastSync } = await supabase
          .from('lpa_sync_log')
          .select('last_synced_at')
          .eq('lpa_id', borough.id)
          .single()

        // Determine date range to sync
        let dateRange
        if (lastSync?.last_synced_at) {
          const lastSyncDate = new Date(lastSync.last_synced_at)
          const today = new Date()
          dateRange = {
            from: formatDateForAPI(lastSyncDate),
            to: formatDateForAPI(today)
          }
        } else {
          // First time syncing - get last 7 days
          dateRange = getInitialSyncDateRange()
        }

        console.log(`📅 Syncing ${borough.name} from ${dateRange.from} to ${dateRange.to}`)

        // Get all applications for this borough
        const applications = await getAllApplicationsForBorough(
          borough.name,
          dateRange.from,
          dateRange.to
        )

        console.log(`📊 Found ${applications.length} applications for ${borough.name}`)

        let syncedCount = 0
        let errorCount = 0

        // Process each application
        for (const pldApp of applications) {
          try {
            const dbApp = mapApplicationToDatabase(pldApp)

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
            lpa_id: borough.id,
            lpa_name: borough.name,
            last_synced_at: new Date().toISOString(),
            applications_fetched: applications.length,
            status: errorCount > syncedCount ? 'partial_failure' : 'success'
          })

        syncResults.push({
          borough: borough.name,
          found: applications.length,
          synced: syncedCount,
          errors: errorCount,
          status: 'success'
        })

        totalSynced += syncedCount
        totalErrors += errorCount

        console.log(`✅ ${borough.name}: ${syncedCount} synced, ${errorCount} errors`)

        // Rate limiting - wait 2 seconds between borough requests
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (boroughError) {
        console.error(`❌ Failed to sync borough ${borough.name}:`, boroughError)

        syncResults.push({
          borough: borough.name,
          found: 0,
          synced: 0,
          errors: 1,
          status: 'error',
          error: boroughError.message
        })

        totalErrors++

        // Log the failure
        await supabase
          .from('lpa_sync_log')
          .upsert({
            lpa_id: borough.id,
            lpa_name: borough.name,
            last_synced_at: new Date().toISOString(),
            applications_fetched: 0,
            status: 'error'
          })

        // Don't let one borough failure stop the whole sync
        continue
      }
    }

    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    console.log(`🎉 London sync completed in ${duration}s`)
    console.log(`📊 Total: ${totalSynced} synced, ${totalErrors} errors`)

    return res.status(200).json({
      success: true,
      summary: {
        boroughs_processed: allBoroughs.length,
        total_synced: totalSynced,
        total_errors: totalErrors,
        duration_seconds: Math.round(duration),
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString()
      },
      results: syncResults
    })

  } catch (error) {
    console.error('💥 London sync failed:', error)

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