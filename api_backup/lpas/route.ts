/**
 * Local Planning Authorities (LPAs) API
 * Get list of all available councils and their application counts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPlanningApiClient } from '@/lib/planning-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const planningApi = createPlanningApiClient()

    // Get all LPAs from Planning API
    const allLPAs = await planningApi.fetchLPAs()

    let filteredLPAs = allLPAs

    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredLPAs = allLPAs.filter(lpa =>
        lpa.name.toLowerCase().includes(searchTerm) ||
        lpa.id.toLowerCase().includes(searchTerm)
      )
    }

    // Sort by application count (descending)
    filteredLPAs.sort((a, b) => parseInt(b.application_count) - parseInt(a.application_count))

    // Apply limit if specified
    if (limit) {
      filteredLPAs = filteredLPAs.slice(0, limit)
    }

    // Transform data for frontend
    const lpasWithStats = filteredLPAs.map(lpa => ({
      id: lpa.id,
      name: lpa.name,
      displayName: lpa.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      applicationCount: parseInt(lpa.application_count),
      searchParams: {
        lpa_id: lpa.id,
        council: lpa.name
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        lpas: lpasWithStats,
        total: allLPAs.length,
        filtered: filteredLPAs.length,
        searchTerm: search || null
      },
      message: search
        ? `Found ${filteredLPAs.length} LPAs matching "${search}"`
        : `Retrieved ${filteredLPAs.length} LPAs`
    })

  } catch (error) {
    console.error('LPAs API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch LPAs'
    }, { status: 500 })
  }
}