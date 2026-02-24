import { createBrowserClient } from '../../lib/supabase/pages-client'

// Simple mock data for now - will integrate with real database later
const mockApplications = [
  {
    id: '1',
    title: 'Single storey rear extension',
    address: '123 High Street, Bristol',
    postcode: 'BS1 5AH',
    council: 'Bristol City Council',
    status: 'Approved',
    date_validated: '2024-01-15',
    applicant: 'John Smith',
    type: 'Householder'
  },
  {
    id: '2',
    title: 'Two storey side extension',
    address: '45 Park Road, Bristol',
    postcode: 'BS2 8QW',
    council: 'Bristol City Council',
    status: 'Pending',
    date_validated: '2024-01-20',
    applicant: 'Sarah Johnson',
    type: 'Householder'
  },
  {
    id: '3',
    title: 'Change of use from retail to residential',
    address: '67 Queen Street, Bristol',
    postcode: 'BS1 4DF',
    council: 'Bristol City Council',
    status: 'Refused',
    date_validated: '2024-01-18',
    applicant: 'Bristol Properties Ltd',
    type: 'Change of Use'
  },
  {
    id: '4',
    title: 'New detached dwelling',
    address: 'Land adjacent to 89 Oak Avenue, Bristol',
    postcode: 'BS3 2NP',
    council: 'Bristol City Council',
    status: 'Approved',
    date_validated: '2024-01-10',
    applicant: 'Green Homes Development',
    type: 'Full Application'
  },
  {
    id: '5',
    title: 'Loft conversion with dormer windows',
    address: '22 Elm Grove, Bristol',
    postcode: 'BS4 3RT',
    council: 'Bristol City Council',
    status: 'Pending',
    date_validated: '2024-01-25',
    applicant: 'Mike Wilson',
    type: 'Householder'
  }
]

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get query parameters
    const {
      postcode,
      council,
      status,
      keyword,
      page = 1,
      limit = 10
    } = req.query

    // TODO: Get user session and check plan limits
    // For now, we'll simulate plan limits
    const userPlan = 'free_trial' // TODO: Get from database

    // Apply plan limits
    let filteredResults = [...mockApplications]

    // Apply filters
    if (postcode) {
      // Simple postcode area matching (first 2-3 characters)
      const postcodeArea = postcode.replace(/\s/g, '').substring(0, 3).toLowerCase()
      filteredResults = filteredResults.filter(app =>
        app.postcode.replace(/\s/g, '').toLowerCase().startsWith(postcodeArea)
      )
    }

    if (council) {
      filteredResults = filteredResults.filter(app =>
        app.council.toLowerCase().includes(council.toLowerCase())
      )
    }

    if (status) {
      filteredResults = filteredResults.filter(app =>
        app.status.toLowerCase() === status.toLowerCase()
      )
    }

    if (keyword) {
      // For free trial users, keyword search is not allowed
      if (userPlan === 'free_trial') {
        return res.status(403).json({
          error: 'Keyword search requires Pro or Premium plan',
          upgrade_required: true
        })
      }

      filteredResults = filteredResults.filter(app =>
        app.title.toLowerCase().includes(keyword.toLowerCase()) ||
        app.address.toLowerCase().includes(keyword.toLowerCase())
      )
    }

    // Apply plan limits
    if (userPlan === 'free_trial') {
      filteredResults = filteredResults.slice(0, 10) // Limit to 10 results
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedResults = filteredResults.slice(startIndex, endIndex)

    // Response
    return res.status(200).json({
      applications: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredResults.length,
        total_pages: Math.ceil(filteredResults.length / limitNum)
      },
      user_plan: userPlan,
      limits_applied: userPlan === 'free_trial' && filteredResults.length >= 10
    })

  } catch (error) {
    console.error('Search API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}