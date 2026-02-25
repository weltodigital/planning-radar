import { createServiceClient } from '../../../lib/supabase/pages-client'
import { searchApplications, mapApplicationToDatabase, formatDateForAPI } from '../../../lib/planning-london-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check
  const authHeader = req.headers.authorization
  if (authHeader !== 'Bearer admin-secret-change-in-production') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { borough = 'Camden' } = req.body

    console.log(`🚀 Starting sync for ${borough}...`)

    // Last 7 days
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)

    const dateFrom = formatDateForAPI(weekAgo)
    const dateTo = formatDateForAPI(today)

    console.log(`📅 Date range: ${dateFrom} to ${dateTo}`)

    // Fetch from Planning London Datahub
    const result = await searchApplications(borough, dateFrom, dateTo, 0, 50)
    console.log(`📡 Found ${result.applications.length} applications`)

    if (result.applications.length === 0) {
      return res.status(200).json({
        success: true,
        borough,
        message: 'No applications found',
        applications_processed: 0
      })
    }

    // Map and insert applications
    const supabase = createServiceClient()
    const successfulInserts = []
    const failedInserts = []

    for (const rawApp of result.applications) {
      try {
        const mappedApp = mapApplicationToDatabase(rawApp)

        // Log what we're trying to insert
        console.log(`💾 Inserting: ${mappedApp.external_id}`)
        console.log(`   Title: ${mappedApp.title?.substring(0, 50)}...`)
        console.log(`   Address: ${mappedApp.address}`)
        console.log(`   Ward: ${mappedApp.ward}`)
        console.log(`   Fields: ${Object.keys(mappedApp).length}`)

        const { data, error } = await supabase
          .from('planning_applications')
          .upsert([mappedApp], {
            onConflict: 'external_id',
            ignoreDuplicates: false
          })
          .select()

        if (error) {
          console.error(`❌ Insert failed for ${mappedApp.external_id}:`, error)
          failedInserts.push({
            external_id: mappedApp.external_id,
            error: error.message
          })
        } else {
          console.log(`✅ Successfully inserted ${mappedApp.external_id}`)
          successfulInserts.push(mappedApp.external_id)
        }

        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Processing failed for application:`, error)
        failedInserts.push({
          external_id: 'unknown',
          error: error.message
        })
      }
    }

    const summary = {
      success: true,
      borough,
      date_range: `${dateFrom} to ${dateTo}`,
      total_found: result.applications.length,
      successful_inserts: successfulInserts.length,
      failed_inserts: failedInserts.length,
      successful_applications: successfulInserts,
      failed_applications: failedInserts.slice(0, 5) // Only show first 5 failures
    }

    console.log(`🎉 Sync complete: ${successfulInserts.length}/${result.applications.length} successful`)

    return res.status(200).json(summary)

  } catch (error) {
    console.error('❌ Sync failed:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}