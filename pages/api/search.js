import { createServiceClient } from '../../lib/supabase/pages-client'
import { geocodePostcode, milesToMeters } from '../../lib/geocode'
import { getUserPlan, applyPlanLimits, checkPlanPermission } from '../../lib/plan-enforcement'

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
      applicant,
      agent,
      page = 1,
      limit = 10
    } = req.query

    // Get user from session (currently supporting both authenticated and demo modes)
    let userId = null
    const isDemo = req.headers['x-demo-mode'] === 'true'

    // For demo mode, use null userId which defaults to free plan
    if (!isDemo) {
      // TODO: Extract userId from auth session when authentication middleware is enabled
      // For now, we'll handle both authenticated and unauthenticated requests
      const authHeader = req.headers.authorization
      if (authHeader) {
        try {
          const supabase = createServiceClient()
          const token = authHeader.replace('Bearer ', '')
          const { data: { user } } = await supabase.auth.getUser(token)
          userId = user?.id || null
        } catch (error) {
          // Invalid auth, continue as anonymous
          console.log('Invalid auth token, continuing as anonymous')
        }
      }
    }

    // Apply plan enforcement to search parameters
    const { params: enforcedParams, plan, status: planStatus, limitsApplied, limits } = await applyPlanLimits(userId, req.query)

    // Check keyword search permission
    if (req.query.keyword && !limits.keywordSearch && !isDemo) {
      return res.status(403).json({
        error: 'Keyword search requires Pro or Premium plan',
        upgrade_required: true,
        current_plan: plan
      })
    }

    // Check applicant/agent search permission (Premium only)
    if ((req.query.applicant || req.query.agent) && !limits.applicantSearch && !isDemo) {
      return res.status(403).json({
        error: 'Applicant and agent search requires Premium plan',
        upgrade_required: true,
        current_plan: plan
      })
    }

    // Build database query
    const supabase = createServiceClient()
    let query = supabase
      .from('planning_applications')
      .select('id, external_id, title, description, address, postcode, lpa_name, ward, decision, date_validated, date_decision, decision_target_date, applicant_name, agent_name, application_type, development_type, application_type_full, url_planning_app, appeal_status, uprn, locality, site_name, site_number, street_name')
      .order('date_validated', { ascending: false })

    // Use enforced parameters for filtering
    const { postcode, council, status, keyword } = enforcedParams
    const { applicant, agent } = req.query // These don't get modified by plan enforcement
    const queryLimit = parseInt(enforcedParams.limit) || 10

    // Apply filters
    if (postcode) {
      // Try geographic radius search first (more accurate)
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

    if (keyword && limits.keywordSearch) {
      // Enhanced full-text search on title, description, and address
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,address.ilike.%${keyword}%,application_details.ilike.%${keyword}%`)
    }

    // Apply applicant search (Premium only)
    if (applicant && limits.applicantSearch) {
      query = query.ilike('applicant_name', `%${applicant}%`)
    }

    // Apply agent search (Premium only)
    if (agent && limits.applicantSearch) {
      query = query.ilike('agent_name', `%${agent}%`)
    }

    // Apply date filtering if enforced by plan
    if (enforcedParams.date_from) {
      query = query.gte('date_validated', enforcedParams.date_from)
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
      const coordinates = await geocodePostcode(postcode)

      if (coordinates) {
        // Use PostGIS radius search for count too
        const radiusMeters = radius ? parseFloat(radius) * 1609.34 : 1609.34
        const point = `ST_SetSRID(ST_MakePoint(${coordinates.lng}, ${coordinates.lat}), 4326)::geography`
        totalQuery = totalQuery.filter('location', 'st_dwithin', `${point}, ${radiusMeters}`)
      } else {
        // Fallback to postcode area matching
        const postcodeArea = postcode.replace(/\s/g, '').substring(0, 3).toUpperCase()
        totalQuery = totalQuery.ilike('postcode', `${postcodeArea}%`)
      }
    }
    if (council) {
      totalQuery = totalQuery.ilike('lpa_name', `%${council}%`)
    }
    if (status) {
      totalQuery = totalQuery.ilike('decision', `%${status}%`)
    }
    if (keyword && limits.keywordSearch) {
      totalQuery = totalQuery.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,address.ilike.%${keyword}%,application_details.ilike.%${keyword}%`)
    }
    if (applicant && limits.applicantSearch) {
      totalQuery = totalQuery.ilike('applicant_name', `%${applicant}%`)
    }
    if (agent && limits.applicantSearch) {
      totalQuery = totalQuery.ilike('agent_name', `%${agent}%`)
    }
    if (enforcedParams.date_from) {
      totalQuery = totalQuery.gte('date_validated', enforcedParams.date_from)
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
      plan: {
        name: plan,
        status: planStatus,
        limits: limits
      },
      limits_applied: limitsApplied,
      search_params_used: enforcedParams
    })

  } catch (error) {
    console.error('Search API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}