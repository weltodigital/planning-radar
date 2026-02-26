/**
 * Check Data Sync Status
 *
 * Admin endpoint to check the status of all data sync operations
 * including planning applications and Land Registry imports.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Verify admin authorization
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get planning application sync status
    const { data: planningSync } = await supabase
      .from('lpa_sync_log')
      .select('*')
      .order('last_synced_at', { ascending: false })
      .limit(10)

    // Get Land Registry sync status
    const { data: landRegistrySync } = await supabase
      .from('data_sync_log')
      .select('*')
      .eq('sync_type', 'land_registry_monthly')
      .order('completed_at', { ascending: false })
      .limit(10)

    // Get data counts
    const [
      { count: planningCount },
      { count: landRegistryCount },
      { count: constraintsCount },
      { count: listedBuildingsCount }
    ] = await Promise.all([
      supabase.from('planning_applications').select('*', { count: 'exact', head: true }),
      supabase.from('land_registry_prices').select('*', { count: 'exact', head: true }),
      supabase.from('planning_constraints').select('*', { count: 'exact', head: true }),
      supabase.from('listed_buildings').select('*', { count: 'exact', head: true })
    ])

    // Get latest records
    const { data: latestPlanningApp } = await supabase
      .from('planning_applications')
      .select('created_at, lpa_name, title')
      .order('created_at', { ascending: false })
      .limit(1)

    const { data: latestLandRegistry } = await supabase
      .from('land_registry_prices')
      .select('date_of_transfer, postcode, price')
      .order('date_of_transfer', { ascending: false })
      .limit(1)

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data_counts: {
        planning_applications: planningCount || 0,
        land_registry_prices: landRegistryCount || 0,
        planning_constraints: constraintsCount || 0,
        listed_buildings: listedBuildingsCount || 0
      },
      latest_records: {
        planning_application: latestPlanningApp?.[0] || null,
        land_registry: latestLandRegistry?.[0] || null
      },
      sync_history: {
        planning_applications: planningSync || [],
        land_registry: landRegistrySync || []
      }
    })

  } catch (error) {
    console.error('Failed to get sync status:', error.message)
    return res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      details: error.message
    })
  }
}