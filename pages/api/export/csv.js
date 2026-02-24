/**
 * CSV Export API - Premium Feature
 * Exports planning application search results as CSV file
 */

import { createServiceClient } from '../../../lib/supabase/pages-client'

async function getUserPlan(supabase, userId) {
  if (!userId) return 'free_trial'

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, trial_ends_at, status')
      .eq('user_id', userId)
      .single()

    if (error || !data) return 'free_trial'

    // Check if trial has expired
    if (data.plan === 'free_trial' && data.trial_ends_at) {
      const trialEnd = new Date(data.trial_ends_at)
      if (trialEnd < new Date()) {
        return 'expired'
      }
    }

    // Check subscription status
    if (data.status !== 'active') {
      return 'expired'
    }

    return data.plan
  } catch (error) {
    console.error('Error getting user plan:', error)
    return 'free_trial'
  }
}

function formatCSV(applications) {
  if (!applications || applications.length === 0) {
    return 'No applications found'
  }

  // CSV headers
  const headers = [
    'Date Validated',
    'Title',
    'Address',
    'Postcode',
    'Council',
    'Status',
    'Applicant',
    'Application Type',
    'Date Received',
    'Date Decision'
  ]

  // Convert applications to CSV rows
  const rows = applications.map(app => [
    app.date_validated || '',
    `"${(app.title || '').replace(/"/g, '""')}"`, // Escape quotes
    `"${(app.address || '').replace(/"/g, '""')}"`,
    app.postcode || '',
    app.council || '',
    app.status || '',
    `"${(app.applicant || '').replace(/"/g, '""')}"`,
    app.type || '',
    app.date_received || '',
    app.date_decision || ''
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createServiceClient()

  // For this demo, we'll simulate no authentication
  // In production, you'd get the user from session cookies
  const user = null // Get from auth session

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - please sign in' })
  }

  const userPlan = await getUserPlan(supabase, user.id)

  // Check if user has access to CSV export (Premium only)
  if (userPlan !== 'premium') {
    return res.status(403).json({
      error: 'CSV export requires Premium plan',
      upgrade_required: true,
      feature: 'csv_export'
    })
  }

  try {
    // Get query parameters (same as search API)
    const {
      postcode,
      council,
      status,
      keyword,
      date_from,
      date_to,
      limit = 10000 // Max 10k rows per export
    } = req.query

    // Build database query (similar to search API)
    let query = supabase
      .from('planning_applications')
      .select('id, title, address, postcode, lpa_name, decision, date_validated, date_received, date_decision, applicant_name, application_type')
      .order('date_validated', { ascending: false })

    // Apply filters
    if (postcode) {
      const postcodeArea = postcode.replace(/\s/g, '').substring(0, 3).toUpperCase()
      query = query.ilike('postcode', `${postcodeArea}%`)
    }

    if (council) {
      query = query.ilike('lpa_name', `%${council}%`)
    }

    if (status) {
      query = query.ilike('decision', `%${status}%`)
    }

    if (keyword) {
      // Full-text search on title and address (Premium feature)
      query = query.or(`title.ilike.%${keyword}%,address.ilike.%${keyword}%`)
    }

    if (date_from) {
      query = query.gte('date_validated', date_from)
    }

    if (date_to) {
      query = query.lte('date_validated', date_to)
    }

    // Apply limit (max 10k for performance)
    const exportLimit = Math.min(parseInt(limit), 10000)
    query = query.limit(exportLimit)

    // Execute query
    const { data: applications, error } = await query

    if (error) {
      console.error('Database query error:', error)
      return res.status(500).json({ error: 'Export failed' })
    }

    // Format results for CSV
    const formattedApplications = (applications || []).map(app => ({
      id: app.id,
      title: app.title,
      address: app.address,
      postcode: app.postcode,
      council: app.lpa_name,
      status: app.decision || 'Pending',
      date_validated: app.date_validated,
      date_received: app.date_received,
      date_decision: app.date_decision,
      applicant: app.applicant_name,
      type: app.application_type
    }))

    // Generate CSV content
    const csvContent = formatCSV(formattedApplications)

    // Generate filename with current date
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `planning_applications_${timestamp}.csv`

    // Set CSV response headers
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-cache')

    return res.status(200).send(csvContent)

  } catch (error) {
    console.error('CSV export error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}