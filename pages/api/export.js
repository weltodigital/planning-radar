import { createServiceClient } from '../../lib/supabase/pages-client'
import { geocodePostcode } from '../../lib/geocode'
import { checkPlanPermission } from '../../lib/plan-enforcement'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authenticated user
    const supabase = createServiceClient()
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authorization' })
    }

    // Check if user has premium plan (CSV export requires Premium)
    const permission = await checkPlanPermission(user.id, 'csvExport')

    if (!permission.allowed) {
      return res.status(403).json({
        error: permission.message,
        upgrade_required: true,
        current_plan: permission.plan
      })
    }

    // Get query parameters (same as search API)
    const {
      postcode,
      radius = 1,
      council,
      status,
      keyword,
      applicant,
      agent,
      date_from,
      date_to,
      limit = 10000 // Max 10k records for CSV export
    } = req.query

    // Build database query
    let query = supabase
      .from('planning_applications')
      .select('external_id, title, description, address, postcode, lpa_name, ward, decision, date_validated, date_received, date_decision, decision_target_date, applicant_name, agent_name, application_type, development_type, application_type_full, url_planning_app, appeal_status, uprn, locality')
      .order('date_validated', { ascending: false })

    // Apply same filters as search API
    if (postcode) {
      // Try geographic radius search first (same as search API)
      const coordinates = await geocodePostcode(postcode)

      if (coordinates) {
        // Use PostGIS radius search
        const radiusMeters = radius ? parseFloat(radius) * 1609.34 : 1609.34 // Convert miles to meters
        const point = `ST_SetSRID(ST_MakePoint(${coordinates.lng}, ${coordinates.lat}), 4326)::geography`

        // Use PostGIS ST_DWithin for radius search
        query = query.filter('location', 'st_dwithin', `${point}, ${radiusMeters}`)
      } else {
        // Fallback to postcode area matching if geocoding fails
        const postcodeArea = postcode.replace(/\s/g, '').substring(0, 3).toUpperCase()
        query = query.ilike('postcode', `${postcodeArea}%`)
      }
    }

    if (council) {
      query = query.ilike('lpa_name', `%${council}%`)
    }

    if (status) {
      query = query.ilike('decision', `%${status}%`)
    }

    if (keyword) {
      // Enhanced full-text search on title, description, and address
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,address.ilike.%${keyword}%`)
    }

    if (applicant) {
      query = query.ilike('applicant_name', `%${applicant}%`)
    }

    if (agent) {
      query = query.ilike('agent_name', `%${agent}%`)
    }

    if (date_from) {
      query = query.gte('date_validated', date_from)
    }

    if (date_to) {
      query = query.lte('date_validated', date_to)
    }

    // Limit to 10k records max for performance
    query = query.limit(Math.min(parseInt(limit), 10000))

    // Execute query
    const { data: applications, error } = await query

    if (error) {
      console.error('Export query error:', error)
      return res.status(500).json({ error: 'Export failed' })
    }

    // Generate CSV headers
    const csvHeaders = [
      'Reference',
      'Title',
      'Description',
      'Address',
      'Postcode',
      'Council',
      'Ward',
      'Status',
      'Application Type',
      'Development Type',
      'Received Date',
      'Validated Date',
      'Decision Date',
      'Target Decision Date',
      'Applicant',
      'Agent',
      'Council URL',
      'Appeal Status',
      'UPRN',
      'Locality'
    ]

    // Generate CSV rows
    const csvRows = applications.map(app => [
      app.external_id || '',
      (app.title || '').replace(/"/g, '""'),
      (app.description || '').replace(/"/g, '""'),
      (app.address || '').replace(/"/g, '""'),
      app.postcode || '',
      app.lpa_name || '',
      app.ward || '',
      app.decision || 'Pending',
      app.application_type || '',
      app.development_type || '',
      app.date_received ? new Date(app.date_received).toLocaleDateString() : '',
      app.date_validated ? new Date(app.date_validated).toLocaleDateString() : '',
      app.date_decision ? new Date(app.date_decision).toLocaleDateString() : '',
      app.decision_target_date ? new Date(app.decision_target_date).toLocaleDateString() : '',
      (app.applicant_name || '').replace(/"/g, '""'),
      (app.agent_name || '').replace(/"/g, '""'),
      app.url_planning_app || '',
      app.appeal_status || '',
      app.uprn || '',
      app.locality || ''
    ])

    // Format as CSV
    const csvContent = [
      csvHeaders.map(header => `"${header}"`).join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `planning-radar-export-${timestamp}.csv`

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-cache')

    // Add UTF-8 BOM for Excel compatibility
    return res.status(200).send('\uFEFF' + csvContent)

  } catch (error) {
    console.error('Export API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}