/**
 * Planning Application Count API
 * Get application counts for LPAs and date ranges using free Planning API calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPlanningApiClient, formatApiDate } from '@/lib/planning-api'
import { geocodePostcode } from '@/lib/geocode'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { getPlanLimits } from '@/lib/plans'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get authenticated user and their plan
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const userPlan = await getUserPlan(user.id)
    const planLimits = getPlanLimits(userPlan)

    const postcode = searchParams.get('postcode')
    const council = searchParams.get('council')
    const lpaId = searchParams.get('lpa_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const daysBack = searchParams.get('days_back') ? parseInt(searchParams.get('days_back')!) : 30

    // Default date range (last 30 days if not specified)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - daysBack)

    let searchDateFrom = dateFrom || formatApiDate(startDate)
    const searchDateTo = dateTo || formatApiDate(endDate)

    // Apply plan-based date restrictions
    if (planLimits.historyDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - planLimits.historyDays)
      const cutoffDateStr = formatApiDate(cutoffDate)

      if (searchDateFrom < cutoffDateStr) {
        searchDateFrom = cutoffDateStr
      }
    }

    const planningApi = createPlanningApiClient()

    if (lpaId) {
      // Get count for specific LPA
      try {
        const count = await planningApi.getApplicationsCount({
          lpaId,
          dateFrom: searchDateFrom,
          dateTo: searchDateTo
        })

        return NextResponse.json({
          success: true,
          data: {
            lpaId,
            applicationCount: count,
            dateFrom: searchDateFrom,
            dateTo: searchDateTo,
            planInfo: {
              plan: userPlan,
              dateRestricted: !!planLimits.historyDays
            }
          },
          message: `Found ${count} applications for LPA ${lpaId} (${userPlan} plan)`
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `Failed to get count for LPA ${lpaId}: ${error}`
        }, { status: 400 })
      }
    }

    if (council) {
      // Find LPA ID from council name
      try {
        const allLPAs = await planningApi.fetchLPAs()
        const matchingLPA = allLPAs.find(lpa =>
          lpa.name.toLowerCase().includes(council.toLowerCase()) ||
          lpa.id.toLowerCase().includes(council.toLowerCase())
        )

        if (!matchingLPA) {
          return NextResponse.json({
            success: false,
            error: `Council '${council}' not found`
          }, { status: 404 })
        }

        const count = await planningApi.getApplicationsCount({
          lpaId: matchingLPA.id,
          dateFrom: searchDateFrom,
          dateTo: searchDateTo
        })

        return NextResponse.json({
          success: true,
          data: {
            lpaId: matchingLPA.id,
            lpaName: matchingLPA.name,
            council,
            applicationCount: count,
            dateFrom: searchDateFrom,
            dateTo: searchDateTo,
            planInfo: {
              plan: userPlan,
              dateRestricted: !!planLimits.historyDays
            }
          },
          message: `Found ${count} applications for ${matchingLPA.name} (${userPlan} plan)`
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `Failed to search by council: ${error}`
        }, { status: 400 })
      }
    }

    if (postcode) {
      // For postcode search, we'd need to:
      // 1. Geocode the postcode
      // 2. Find nearby LPAs (complex - would need LPA boundaries)
      // 3. Get counts for those LPAs
      // For now, return a helpful message

      const geocoded = await geocodePostcode(postcode)
      if (!geocoded) {
        return NextResponse.json({
          success: false,
          error: 'Invalid postcode'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: {
          postcode,
          coordinates: geocoded,
          message: 'Postcode geocoded successfully. To get application counts, specify a council or lpa_id.'
        }
      })
    }

    // No specific search parameters - return usage info
    return NextResponse.json({
      success: true,
      message: 'Planning Application Count API',
      usage: {
        'GET ?lpa_id=bristol': 'Get count for specific LPA ID',
        'GET ?council=bristol': 'Search by council name',
        'GET ?postcode=BS1 1AA': 'Geocode postcode (counts require council/lpa_id)',
        parameters: {
          date_from: 'Start date (YYYY-MM-DD)',
          date_to: 'End date (YYYY-MM-DD)',
          days_back: 'Days to look back (default: 30)'
        }
      },
      note: 'This endpoint uses free Planning API calls only'
    })

  } catch (error) {
    console.error('Count API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}