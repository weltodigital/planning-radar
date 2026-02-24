/**
 * CSV Export API - Premium feature only
 * Export planning applications to CSV format with same filters as main search
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { getPlanLimits } from '@/lib/plans'
import { geocodePostcode, milesToMeters } from '@/lib/geocode'
import { SearchParams, PlanningApplication } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse search parameters (same as main search API)
    const params: SearchParams = {
      postcode: searchParams.get('postcode') || undefined,
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined,
      council: searchParams.get('council') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      decision: searchParams.get('decision') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '1000'), 10000), // Max 10K rows per export
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

    // Check if user has access to CSV export (Premium only)
    if (!planLimits.csvExport) {
      return NextResponse.json({
        success: false,
        error: 'CSV export requires Premium plan',
        upgrade: {
          feature: 'CSV Export',
          requiredPlan: 'Premium',
          currentPlan: userPlan
        }
      }, { status: 403 })
    }

    // Enforce plan limitations (same as main search)
    if (params.keyword && !planLimits.keywordFilters) {
      return NextResponse.json({
        success: false,
        error: 'Keyword search requires Pro or Premium plan'
      }, { status: 403 })
    }

    // Apply date range restrictions
    if (planLimits.historyDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - planLimits.historyDays)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      if (!params.date_from || params.date_from < cutoffDateStr) {
        params.date_from = cutoffDateStr
      }
    }

    // Build the query based on search parameters (same logic as main search)
    let query = supabase
      .from('planning_applications')
      .select('*')

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
          error: 'Invalid postcode or geocoding failed'
        }, { status: 400 })
      }

      const radiusMeters = milesToMeters(params.radius || 1)

      query = (query as any).rpc('search_applications_near_point', {
        search_lat: geocoded.lat,
        search_lng: geocoded.lng,
        radius_meters: radiusMeters
      })
    }

    // Apply limit and order
    query = query
      .limit(params.limit || 1000)
      .order('date_validated', { ascending: false })

    const { data: applications, error } = await query

    if (error) {
      console.error('CSV export error:', error)
      return NextResponse.json({
        success: false,
        error: 'Export failed'
      }, { status: 500 })
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No applications found matching your criteria'
      }, { status: 404 })
    }

    // Generate CSV content
    const csvHeaders = [
      'External ID',
      'LPA ID',
      'LPA Name',
      'Title',
      'Address',
      'Postcode',
      'Latitude',
      'Longitude',
      'Date Validated',
      'Date Received',
      'Date Decision',
      'Decision',
      'Applicant Name',
      'Agent Name',
      'Application Type',
      'External Link'
    ]

    const csvRows = applications.map((app: PlanningApplication) => [
      app.external_id || '',
      app.lpa_id || '',
      app.lpa_name || '',
      `"${(app.title || '').replace(/"/g, '""')}"`, // Escape quotes
      `"${(app.address || '').replace(/"/g, '""')}"`,
      app.postcode || '',
      app.lat || '',
      app.lng || '',
      app.date_validated || '',
      app.date_received || '',
      app.date_decision || '',
      app.decision || '',
      `"${(app.applicant_name || '').replace(/"/g, '""')}"`,
      `"${(app.agent_name || '').replace(/"/g, '""')}"`,
      app.application_type || '',
      app.external_link || ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `planning-applications-${timestamp}.csv`

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('CSV export API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}