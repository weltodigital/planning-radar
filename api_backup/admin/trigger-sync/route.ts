/**
 * Admin endpoint for manually triggering sync operations
 * Useful for testing and manual data updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncLPAApplications, syncMultipleLPAs, getSyncStats } from '@/lib/data-sync'
import { createPlanningApiClient } from '@/lib/planning-api'

export async function POST(request: NextRequest) {
  try {
    // Simple admin protection (in production, use proper auth)
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, lpaIds, lpaId, dateFrom, dateTo, maxLPAs } = body

    console.log(`Admin sync request: ${action}`)

    switch (action) {
      case 'sync_single_lpa': {
        if (!lpaId) {
          return NextResponse.json(
            { error: 'lpaId required for single LPA sync' },
            { status: 400 }
          )
        }

        // Get LPA name
        const planningApi = createPlanningApiClient()
        const allLPAs = await planningApi.fetchLPAs()
        const lpa = allLPAs.find(l => l.id === lpaId)
        const lpaName = lpa?.name || lpaId

        const result = await syncLPAApplications(lpaId, lpaName, dateFrom, dateTo)

        return NextResponse.json({
          success: result.success,
          result,
          message: `Sync ${result.success ? 'completed' : 'failed'} for ${lpaName}`
        })
      }

      case 'sync_multiple_lpas': {
        if (!lpaIds || !Array.isArray(lpaIds)) {
          return NextResponse.json(
            { error: 'lpaIds array required for multiple LPA sync' },
            { status: 400 }
          )
        }

        const summary = await syncMultipleLPAs(lpaIds, { dateFrom, dateTo })

        return NextResponse.json({
          success: summary.failedLPAs === 0,
          summary,
          message: `Synced ${summary.totalApplicationsInserted} applications from ${summary.successfulLPAs}/${summary.totalLPAs} LPAs`
        })
      }

      case 'test_sync': {
        console.log('Running test sync with first 5 LPAs...')

        const planningApi = createPlanningApiClient()
        const allLPAs = await planningApi.fetchLPAs()
        const testLPAs = allLPAs.slice(0, 5).map(lpa => lpa.id)

        const summary = await syncMultipleLPAs(testLPAs, {
          dateFrom,
          dateTo,
          delayMs: 1000 // Slower for testing
        })

        return NextResponse.json({
          success: summary.failedLPAs === 0,
          summary,
          message: `Test sync completed: ${summary.totalApplicationsInserted} applications from ${summary.successfulLPAs}/${summary.totalLPAs} LPAs`,
          note: 'This was a limited test with 5 LPAs only'
        })
      }

      case 'get_stats': {
        const stats = await getSyncStats()

        return NextResponse.json({
          success: true,
          stats,
          message: 'Sync statistics retrieved'
        })
      }

      default: {
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
      }
    }

  } catch (error) {
    console.error('Admin sync error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({
        message: 'Planning Radar Admin Sync Endpoint',
        usage: {
          'POST with secret': 'Trigger various sync operations',
          'GET?action=stats&secret=xxx': 'Get sync statistics',
          'GET?action=lpas&secret=xxx': 'List available LPAs'
        }
      })
    }

    switch (action) {
      case 'stats': {
        const stats = await getSyncStats()
        return NextResponse.json({
          success: true,
          stats
        })
      }

      case 'lpas': {
        const planningApi = createPlanningApiClient()
        const lpas = await planningApi.fetchLPAs()

        return NextResponse.json({
          success: true,
          lpas: lpas.slice(0, 20), // First 20 for brevity
          total: lpas.length,
          message: `Showing first 20 of ${lpas.length} available LPAs`
        })
      }

      default: {
        const stats = await getSyncStats()
        return NextResponse.json({
          success: true,
          stats,
          actions: [
            'sync_single_lpa',
            'sync_multiple_lpas',
            'test_sync',
            'get_stats'
          ]
        })
      }
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}