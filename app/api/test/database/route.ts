/**
 * Test endpoint to verify database connection and sample data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection and get sample applications
    const { data: applications, error } = await supabase
      .from('planning_applications')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('planning_applications')
      .select('*', { count: 'exact', head: true })

    // Get LPA stats
    const { data: lpaStats } = await supabase
      .from('lpa_stats')
      .select('*')
      .limit(5)

    // Get sync log
    const { data: syncLog } = await supabase
      .from('lpa_sync_log')
      .select('*')
      .limit(5)
      .order('last_synced_at', { ascending: false })

    return NextResponse.json({
      success: true,
      data: {
        totalApplications: totalCount || 0,
        sampleApplications: applications || [],
        lpaStats: lpaStats || [],
        recentSyncs: syncLog || []
      },
      message: `Database connected successfully! Found ${totalCount || 0} planning applications.`
    })

  } catch (error) {
    console.error('Database test error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Database connection failed'
    }, { status: 500 })
  }
}