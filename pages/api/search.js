import { createServiceClient } from '../../lib/supabase/pages-client'
import { geocodePostcode, milesToMeters } from '../../lib/geocode'

// Get user's plan from database
async function getUserPlan(userId) {
  if (!userId) return 'free_trial'

  try {
    const supabase = createServiceClient()
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get query parameters
    const {
      postcode,
      radius = 1, // Default 1 mile radius for postcode search
      council,
      status,
      keyword,
      page = 1,
      limit = 10
    } = req.query

    // TODO: Get user from session - for now use anonymous
    const userId = null // Get from auth session
    const userPlan = await getUserPlan(userId)

    // Check keyword restriction for free trial (allow for demo with very limited results)
    const isDemo = req.headers['x-demo-mode'] === 'true'
    if (keyword && userPlan === 'free_trial' && !isDemo) {
      return res.status(403).json({
        error: 'Keyword search requires Pro or Premium plan',
        upgrade_required: true
      })
    }

    // Build database query
    const supabase = createServiceClient()
    let query = supabase
      .from('planning_applications')
      .select('id, external_id, title, description, address, postcode, lpa_name, ward, decision, date_validated, date_decision, decision_target_date, applicant_name, agent_name, application_type, development_type, application_type_full, url_planning_app, appeal_status, uprn, locality, site_name, site_number, street_name')
      .order('date_validated', { ascending: false })

    // Apply filters
    if (postcode) {
      // Try geographic radius search first (more accurate)
      const coordinates = await geocodePostcode(postcode)

      if (coordinates) {
        // For now, use postcode area fallback since PostGIS function needs setup
        // TODO: Implement proper radius search after PostGIS function is created
        const postcodeArea = postcode.replace(/\s/g, '').substring(0, 3).toUpperCase()
        query = query.ilike('postcode', `${postcodeArea}%`)
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

    if (keyword && userPlan !== 'free_trial') {
      // Enhanced full-text search on title, description, and address
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,address.ilike.%${keyword}%,application_details.ilike.%${keyword}%`)
    }

    // Apply plan limits
    let queryLimit = parseInt(limit)
    if (userPlan === 'free_trial') {
      queryLimit = Math.min(queryLimit, 10) // Max 10 results for free trial
    }

    // Pagination
    const pageNum = parseInt(page)
    const offset = (pageNum - 1) * queryLimit

    // Execute query with pagination
    const { data: applications, error, count } = await query
      .range(offset, offset + queryLimit - 1)

    if (error) {
      console.error('Database query error:', error)
      return res.status(500).json({ error: 'Search failed' })
    }

    // Get total count for pagination (separate query for performance)
    let totalQuery = supabase
      .from('planning_applications')
      .select('id', { count: 'exact', head: true })

    // Apply same filters for count
    if (postcode) {
      const postcodeArea = postcode.replace(/\s/g, '').substring(0, 3).toUpperCase()
      totalQuery = totalQuery.ilike('postcode', `${postcodeArea}%`)
    }
    if (council) {
      totalQuery = totalQuery.ilike('lpa_name', `%${council}%`)
    }
    if (status) {
      totalQuery = totalQuery.ilike('decision', `%${status}%`)
    }
    if (keyword && userPlan !== 'free_trial') {
      totalQuery = totalQuery.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,address.ilike.%${keyword}%,application_details.ilike.%${keyword}%`)
    }

    const { count: totalCount } = await totalQuery

    // Format results with rich fields
    const formattedApplications = (applications || []).map(app => {
      // Build address if main address is empty
      let displayAddress = app.address
      if (!displayAddress && (app.site_number || app.street_name || app.site_name)) {
        const addressParts = []
        if (app.site_name) {
          addressParts.push(app.site_name)
        } else if (app.site_number) {
          addressParts.push(app.site_number)
        }
        if (app.street_name) {
          addressParts.push(app.street_name)
        }
        displayAddress = addressParts.join(', ') || null
      }

      return {
        id: app.id,
        reference: app.external_id, // NEW: Application reference number
        title: app.title,
        description: app.description, // NEW: Full planning description
        address: displayAddress,
        postcode: app.postcode,
        council: app.lpa_name,
        ward: app.ward, // NEW: Council ward
        status: app.decision || 'Pending',
        date_validated: app.date_validated,
        applicant: app.applicant_name,
        agent: app.agent_name, // NEW: Agent name
        type: app.development_type || app.application_type || 'Planning Application',
        development_type: app.development_type, // NEW: Development type
        application_type_full: app.application_type_full, // NEW: Full application type

        // Links
        url_planning_app: app.url_planning_app, // NEW: Direct link to council portal

        // Timeline
        decision_date: app.date_decision, // NEW: Decision date
        decision_target_date: app.decision_target_date, // NEW: Target decision date

        // Appeal info
        appeal_status: app.appeal_status, // NEW: Appeal status if any

        // Location details
        uprn: app.uprn, // NEW: Unique Property Reference Number
        locality: app.locality, // NEW: Area/neighborhood

        // Address components for building rich addresses
        site_name: app.site_name,
        site_number: app.site_number,
        street_name: app.street_name
      }
    })

    // Response
    return res.status(200).json({
      applications: formattedApplications,
      pagination: {
        page: pageNum,
        limit: queryLimit,
        total: totalCount || 0,
        total_pages: Math.ceil((totalCount || 0) / queryLimit)
      },
      user_plan: userPlan,
      limits_applied: userPlan === 'free_trial' && (totalCount || 0) > 10
    })

  } catch (error) {
    console.error('Search API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}