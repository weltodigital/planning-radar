/**
 * Planning API Client
 * Handles communication with api.planning.org.uk
 */

const BASE_URL = 'https://api.planning.org.uk/v1'

/**
 * Generate an API key for the planning API
 * @param {string} email - Email address to register
 * @returns {Promise<string>} API key
 */
export async function generateApiKey(email) {
  try {
    const response = await fetch(`${BASE_URL}/generatekey?email=${encodeURIComponent(email)}`)

    if (!response.ok) {
      throw new Error(`Failed to generate API key: ${response.status}`)
    }

    const data = await response.json()

    if (data.response?.status === 'OK' && data.response?.api_key) {
      return data.response.api_key
    }

    throw new Error('Invalid response from planning API')
  } catch (error) {
    console.error('Error generating API key:', error)
    throw error
  }
}

/**
 * Fetch all Local Planning Authorities (LPAs)
 * @param {string} apiKey - Planning API key
 * @returns {Promise<Array>} Array of LPA objects
 */
export async function fetchLPAs(apiKey) {
  try {
    const response = await fetch(`${BASE_URL}/lpas?key=${apiKey}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch LPAs: ${response.status}`)
    }

    const data = await response.json()

    if (data.response?.status === 'OK' && Array.isArray(data.response?.data)) {
      return data.response.data.map(lpa => ({
        id: lpa.id,
        name: lpa.name,
        email: lpa.email,
        domain: lpa.domain
      }))
    }

    throw new Error('Invalid LPA response from planning API')
  } catch (error) {
    console.error('Error fetching LPAs:', error)
    throw error
  }
}

/**
 * Search planning applications for a specific LPA
 * @param {string} apiKey - Planning API key
 * @param {string} lpaId - LPA ID to search
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {boolean} returnData - Whether to return full data (true) or just count (false)
 * @returns {Promise<Object>} Search results
 */
export async function searchApplications(apiKey, lpaId, dateFrom, dateTo, returnData = true) {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      lpa_id: lpaId,
      date_from: dateFrom,
      date_to: dateTo,
      return_data: returnData ? '1' : '0'
    })

    const response = await fetch(`${BASE_URL}/search?${params}`)

    if (!response.ok) {
      throw new Error(`Failed to search applications: ${response.status}`)
    }

    const data = await response.json()

    if (data.response?.status === 'OK') {
      return {
        applicationCount: data.response.application_count || 0,
        applications: data.response.data || []
      }
    }

    // Handle ERROR status - often due to credit limits but still provides counts
    if (data.response?.status === 'ERROR') {
      return {
        applicationCount: data.response.application_count || 0,
        applications: [], // No data due to credits but we get the count
        error: data.response.message || 'API Error'
      }
    }

    throw new Error('Invalid search response from planning API')
  } catch (error) {
    console.error('Error searching applications:', error)
    throw error
  }
}

/**
 * Map planning API application to our database format
 * @param {Object} apiApp - Application from planning API
 * @param {string} lpaId - LPA ID
 * @param {string} lpaName - LPA name
 * @returns {Object} Mapped application for database
 */
export function mapApplicationToDatabase(apiApp, lpaId, lpaName) {
  return {
    external_id: apiApp.keyval || apiApp.id,
    lpa_id: lpaId,
    lpa_name: lpaName.toLowerCase().replace(/\s+/g, '-'),
    title: apiApp.title || 'Planning Application',
    address: apiApp.address || null,
    postcode: apiApp.postcode || null,
    lat: apiApp.lat ? parseFloat(apiApp.lat) : null,
    lng: apiApp.lng ? parseFloat(apiApp.lng) : null,
    date_validated: apiApp.validated || apiApp.date_validated || null,
    date_received: apiApp.received || apiApp.date_received || null,
    date_decision: apiApp.decision_date || null,
    decision: apiApp.decision || null,
    applicant_name: apiApp.applicant || null,
    agent_name: apiApp.agent || null,
    application_type: apiApp.type || null,
    external_link: apiApp.externalLink || apiApp.external_link || null
  }
}

/**
 * Format date for planning API (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDateForAPI(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Get yesterday's date for sync operations
 * @returns {string} Yesterday in YYYY-MM-DD format
 */
export function getYesterday() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateForAPI(yesterday)
}

/**
 * Get date range for initial sync (last 7 days)
 * @returns {Object} Date range object
 */
export function getInitialSyncDateRange() {
  const today = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(today.getDate() - 7)

  return {
    from: formatDateForAPI(weekAgo),
    to: formatDateForAPI(today)
  }
}