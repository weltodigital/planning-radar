/**
 * Main search API endpoint for Planning Radar
 * Supports postcode radius search and LPA-based search with free Planning API calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlanningApiClient } from '@/lib/planning-api'
import { geocodePostcode, milesToMeters } from '@/lib/geocode'
import { getUserPlan, getUserSubscription } from '@/lib/get-user-plan'
import { getPlanLimits } from '@/lib/plans'
import { SearchParams, SearchResult, Plan } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse search parameters
    const params: SearchParams = {
      postcode: searchParams.get('postcode') || undefined,
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined,
      council: searchParams.get('council') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      decision: searchParams.get('decision') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    }

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

    // Enforce plan limitations
    if (params.keyword && !planLimits.keywordFilters) {
      return NextResponse.json({
        success: false,
        error: 'Keyword search requires Pro or Premium plan'
      }, { status: 403 })
    }

    // Apply plan-specific limits
    const maxLimit = Math.min(params.limit || 20, planLimits.maxResults || 1000)
    params.limit = maxLimit

    // Apply date range restrictions
    if (planLimits.historyDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - planLimits.historyDays)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      if (!params.date_from || params.date_from < cutoffDateStr) {
        params.date_from = cutoffDateStr
      }
    }

    // Build the query based on search parameters
    let query = (supabase
      .from('planning_applications') as any)
      .select('*', { count: 'exact' })

    // Apply filters
    if (params.council) {
      query = query.ilike('lpa_name', `%${params.council}%`)
    }

    if (params.keyword) {
      query = query.textSearch('title', params.keyword)
    }

    if (params.decision) {
      query = query.eq('decision', params.decision)
    }

    if (params.date_from) {
      query = query.gte('date_validated', params.date_from)
    }

    if (params.date_to) {
      query = query.lte('date_validated', params.date_to)
    }

    // Handle postcode radius search
    if (params.postcode) {
      const geocoded = await geocodePostcode(params.postcode)

      if (!geocoded) {
        return NextResponse.json({
          success: false,
          error: 'Invalid postcode or geocoding failed',
          data: {
            applications: [],
            total: 0,
            page: params.page || 1,
            limit: params.limit || 20,
            hasMore: false
          }
        }, { status: 400 })
      }

      const radiusMeters = milesToMeters(params.radius || 1) // Default 1 mile

      // PostGIS query for radius search
      query = (query as any).rpc('search_applications_near_point', {
        search_lat: geocoded.lat,
        search_lng: geocoded.lng,
        radius_meters: radiusMeters
      })
    }

    // Apply pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 20)
    query = query.range(offset, offset + (params.limit || 20) - 1)

    // Order by date (most recent first)
    query = query.order('date_validated', { ascending: false })

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database search failed'
      }, { status: 500 })
    }

    // Calculate if there are more results
    const total = count || 0
    const hasMore = offset + (applications?.length || 0) < total

    const result: SearchResult = {
      applications: applications || [],
      total,
      page: params.page || 1,
      limit: params.limit || 20,
      hasMore
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        planInfo: {
          plan: userPlan,
          limits: planLimits,
          appliedLimits: {
            maxResults: maxLimit,
            dateRestricted: !!planLimits.historyDays,
            keywordAllowed: planLimits.keywordFilters
          }
        }
      },
      message: `Found ${total} applications (${userPlan} plan)`
    })

  } catch (error) {
    console.error('Search API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Create the PostGIS search function if it doesn't exist
// This would typically be in a migration, but we'll define it here for reference
/*
CREATE OR REPLACE FUNCTION search_applications_near_point(
  search_lat DECIMAL(9,6),
  search_lng DECIMAL(9,6),
  radius_meters INTEGER
)
RETURNS TABLE(
  id UUID,
  external_id TEXT,
  lpa_id TEXT,
  lpa_name TEXT,
  title TEXT,
  address TEXT,
  postcode TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  location GEOGRAPHY,
  date_validated DATE,
  date_received DATE,
  date_decision DATE,
  decision TEXT,
  applicant_name TEXT,
  agent_name TEXT,
  application_type TEXT,
  external_link TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT pa.*
  FROM planning_applications pa
  WHERE pa.location IS NOT NULL
    AND ST_DWithin(
      pa.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY pa.date_validated DESC;
END;
$$ LANGUAGE plpgsql;
*/