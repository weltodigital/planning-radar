/**
 * Cron job endpoint for syncing planning applications
 * This endpoint is called daily by Vercel Cron to update the database
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAllLPAs } from '@/lib/data-sync'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting scheduled planning application sync...')

    // Parse query parameters for configuration
    const { searchParams } = new URL(request.url)
    const maxLPAs = searchParams.get('max_lpas') ? parseInt(searchParams.get('max_lpas')!) : undefined
    const delayMs = searchParams.get('delay_ms') ? parseInt(searchParams.get('delay_ms')!) : 500
    const daysBack = searchParams.get('days_back') ? parseInt(searchParams.get('days_back')!) : 1

    // Calculate date range (default to yesterday to today)
    const today = new Date()
    const dateFrom = new Date(today)
    dateFrom.setDate(today.getDate() - daysBack)

    const dateFromStr = dateFrom.toISOString().split('T')[0]
    const dateToStr = today.toISOString().split('T')[0]

    console.log(`Syncing applications from ${dateFromStr} to ${dateToStr}`)
    if (maxLPAs) {
      console.log(`Limited to ${maxLPAs} LPAs for testing`)
    }

    // Run the sync
    const summary = await syncAllLPAs({
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      delayMs,
      maxLPAs
    })

    const duration = Date.now() - startTime
    const durationMinutes = Math.round(duration / 1000 / 60)

    console.log(`Sync completed in ${durationMinutes} minutes`)

    // Return summary
    return NextResponse.json({
      success: summary.failedLPAs === 0,
      summary: {
        ...summary,
        durationMinutes
      },
      message: `Synced ${summary.totalApplicationsInserted} applications from ${summary.successfulLPAs} LPAs in ${durationMinutes} minutes`
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('Cron sync error:', error)

    return NextResponse.json({
      success: false,
      error: errorMessage,
      duration
    }, { status: 500 })
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  // Check if it's a manual test request
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'

  if (testMode) {
    // For manual testing, we'll allow GET requests but limit to a small number of LPAs
    console.log('Manual test sync triggered via GET request')

    try {
      const summary = await syncAllLPAs({
        maxLPAs: 3, // Limit to 3 LPAs for testing
        delayMs: 1000 // Slower for testing
      })

      return NextResponse.json({
        success: summary.failedLPAs === 0,
        summary,
        message: 'Test sync completed',
        note: 'This was a limited test sync of 3 LPAs only'
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    }
  }

  return NextResponse.json({
    message: 'Planning Radar Sync Endpoint',
    usage: {
      POST: 'Trigger full sync (requires Authorization header)',
      'GET?test=true': 'Trigger test sync (3 LPAs only)'
    }
  })
}