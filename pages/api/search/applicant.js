/**
 * Applicant/Agent Search API - Premium Feature
 * Search planning applications by applicant or agent names
 * Useful for tracking competitors and finding development opportunities
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

  // Check if user has access to applicant search (Premium only)
  if (userPlan !== 'premium') {
    return res.status(403).json({
      error: 'Applicant and agent search requires Premium plan',
      upgrade_required: true,
      feature: 'applicant_search'
    })
  }

  try {
    // Get query parameters
    const {
      query: searchQuery,
      type = 'both', // 'applicant', 'agent', or 'both'
      council,
      status,
      date_from,
      date_to,
      page = 1,
      limit = 50
    } = req.query

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    // Build database query
    let dbQuery = supabase
      .from('planning_applications')
      .select('id, title, address, postcode, lpa_name, decision, date_validated, applicant_name, agent_name, application_type')
      .order('date_validated', { ascending: false })

    // Apply name search based on type
    if (type === 'applicant') {
      dbQuery = dbQuery.ilike('applicant_name', `%${searchQuery}%`)
    } else if (type === 'agent') {
      dbQuery = dbQuery.ilike('agent_name', `%${searchQuery}%`)
    } else {
      // Search both applicant and agent
      dbQuery = dbQuery.or(`applicant_name.ilike.%${searchQuery}%,agent_name.ilike.%${searchQuery}%`)
    }

    // Apply additional filters
    if (council) {
      dbQuery = dbQuery.ilike('lpa_name', `%${council}%`)
    }

    if (status) {
      dbQuery = dbQuery.ilike('decision', `%${status}%`)
    }

    if (date_from) {
      dbQuery = dbQuery.gte('date_validated', date_from)
    }

    if (date_to) {
      dbQuery = dbQuery.lte('date_validated', date_to)
    }

    // Pagination
    const pageNum = parseInt(page)
    const queryLimit = Math.min(parseInt(limit), 100) // Max 100 per page
    const offset = (pageNum - 1) * queryLimit

    // Execute query with pagination
    const { data: applications, error } = await dbQuery
      .range(offset, offset + queryLimit - 1)

    if (error) {
      console.error('Database query error:', error)
      return res.status(500).json({ error: 'Search failed' })
    }

    // Get total count for pagination
    let totalQuery = supabase
      .from('planning_applications')
      .select('id', { count: 'exact', head: true })

    // Apply same search filters for count
    if (type === 'applicant') {
      totalQuery = totalQuery.ilike('applicant_name', `%${searchQuery}%`)
    } else if (type === 'agent') {
      totalQuery = totalQuery.ilike('agent_name', `%${searchQuery}%`)
    } else {
      totalQuery = totalQuery.or(`applicant_name.ilike.%${searchQuery}%,agent_name.ilike.%${searchQuery}%`)
    }

    if (council) {
      totalQuery = totalQuery.ilike('lpa_name', `%${council}%`)
    }
    if (status) {
      totalQuery = totalQuery.ilike('decision', `%${status}%`)
    }
    if (date_from) {
      totalQuery = totalQuery.gte('date_validated', date_from)
    }
    if (date_to) {
      totalQuery = totalQuery.lte('date_validated', date_to)
    }

    const { count: totalCount } = await totalQuery

    // Format results
    const formattedApplications = (applications || []).map(app => ({
      id: app.id,
      title: app.title,
      address: app.address,
      postcode: app.postcode,
      council: app.lpa_name,
      status: app.decision || 'Pending',
      date_validated: app.date_validated,
      applicant: app.applicant_name,
      agent: app.agent_name,
      type: app.application_type
    }))

    // Response
    return res.status(200).json({
      applications: formattedApplications,
      search_query: searchQuery,
      search_type: type,
      pagination: {
        page: pageNum,
        limit: queryLimit,
        total: totalCount || 0,
        total_pages: Math.ceil((totalCount || 0) / queryLimit)
      },
      user_plan: userPlan
    })

  } catch (error) {
    console.error('Applicant search API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}