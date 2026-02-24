/**
 * Activity Dashboard API
 * Shows trending planning application activity across different LPAs and time periods
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPlanningApiClient, formatApiDate } from '@/lib/planning-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7' // days
    const topN = searchParams.get('top') ? parseInt(searchParams.get('top')!) : 10

    const planningApi = createPlanningApiClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(period))

    const dateFrom = formatApiDate(startDate)
    const dateTo = formatApiDate(endDate)

    console.log(`Getting activity for period: ${dateFrom} to ${dateTo}`)

    // Get all LPAs
    const allLPAs = await planningApi.fetchLPAs()

    // Get the most active LPAs (by total application count)
    const topLPAs = allLPAs
      .sort((a, b) => parseInt(b.application_count) - parseInt(a.application_count))
      .slice(0, topN * 2) // Get more than needed in case some fail

    // Get recent activity for top LPAs
    const activityPromises = topLPAs.map(async (lpa) => {
      try {
        const recentCount = await planningApi.getApplicationsCount({
          lpaId: lpa.id,
          dateFrom,
          dateTo
        })

        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

        return {
          lpaId: lpa.id,
          lpaName: lpa.name,
          displayName: lpa.name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          totalApplications: parseInt(lpa.application_count),
          recentActivity: recentCount,
          activityPeriod: `${period} days`,
          dailyAverage: Math.round((recentCount / parseInt(period)) * 10) / 10
        }
      } catch (error) {
        console.warn(`Failed to get activity for ${lpa.name}:`, error)
        return null
      }
    })

    // Wait for all requests and filter out failures
    const results = await Promise.all(activityPromises)
    const validResults = results.filter(result => result !== null) as Array<{
      lpaId: string
      lpaName: string
      displayName: string
      totalApplications: number
      recentActivity: number
      activityPeriod: string
      dailyAverage: number
    }>

    // Sort by recent activity (descending)
    const sortedByActivity = validResults
      .sort((a, b) => b.recentActivity - a.recentActivity)
      .slice(0, topN)

    // Calculate totals
    const totalRecentActivity = validResults.reduce((sum, lpa) => sum + lpa.recentActivity, 0)
    const averageDailyActivity = Math.round((totalRecentActivity / parseInt(period)) * 10) / 10

    // Get some interesting stats
    const mostActiveLPA = sortedByActivity[0]
    const quietestActiveLPA = sortedByActivity[sortedByActivity.length - 1]

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days: parseInt(period),
          dateFrom,
          dateTo,
          description: `Last ${period} days`
        },
        summary: {
          totalApplications: totalRecentActivity,
          averagePerDay: averageDailyActivity,
          lpasChecked: validResults.length,
          mostActive: mostActiveLPA ? {
            name: mostActiveLPA.displayName,
            applications: mostActiveLPA.recentActivity
          } : null,
          leastActive: quietestActiveLPA ? {
            name: quietestActiveLPA.displayName,
            applications: quietestActiveLPA.recentActivity
          } : null
        },
        topLPAs: sortedByActivity,
        insights: [
          `${mostActiveLPA?.displayName || 'Unknown'} had the most activity with ${mostActiveLPA?.recentActivity || 0} applications`,
          `Average of ${averageDailyActivity} applications per day across all councils`,
          `${sortedByActivity.filter(lpa => lpa.recentActivity > 0).length} councils had new applications in the last ${period} days`
        ]
      },
      message: `Activity summary for ${validResults.length} councils over ${period} days`
    })

  } catch (error) {
    console.error('Activity API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activity data'
    }, { status: 500 })
  }
}