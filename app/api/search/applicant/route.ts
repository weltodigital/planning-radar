/**
 * Applicant/Agent Search API - Premium feature only
 * Search for planning applications by applicant or agent name
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { getPlanLimits } from '@/lib/plans'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter required (minimum 2 characters)'
      }, { status: 400 })
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

    // Check if user has access to applicant search (Premium only)
    if (!planLimits.applicantSearch) {
      return NextResponse.json({
        success: false,
        error: 'Applicant search requires Premium plan',
        upgrade: {
          feature: 'Applicant Search',
          requiredPlan: 'Premium',
          currentPlan: userPlan
        }
      }, { status: 403 })
    }

    // Apply date range restrictions based on plan
    let dateFilter = ''
    if (planLimits.historyDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - planLimits.historyDays)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
      dateFilter = cutoffDateStr
    }

    // Build search query for applicant and agent names
    let searchQuery = supabase
      .from('planning_applications')
      .select('*', { count: 'exact' })
      .or(`applicant_name.ilike.%${query}%,agent_name.ilike.%${query}%`)

    // Apply date filter if required
    if (dateFilter) {
      searchQuery = searchQuery.gte('date_validated', dateFilter)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    searchQuery = searchQuery
      .range(offset, offset + limit - 1)
      .order('date_validated', { ascending: false })

    const { data: applications, error, count } = await searchQuery

    if (error) {
      console.error('Applicant search error:', error)
      return NextResponse.json({
        success: false,
        error: 'Search failed'
      }, { status: 500 })
    }

    // Calculate if there are more results
    const total = count || 0
    const hasMore = offset + (applications?.length || 0) < total

    return NextResponse.json({
      success: true,
      data: {
        applications: applications || [],
        total,
        page,
        limit,
        hasMore,
        query,
        planInfo: {
          plan: userPlan,
          feature: 'Applicant Search',
          dateRestricted: !!dateFilter
        }
      },
      message: `Found ${total} applications for "${query}" (Premium feature)`
    })

  } catch (error) {
    console.error('Applicant search API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}