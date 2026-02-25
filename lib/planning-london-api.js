/**
 * Planning London Datahub API Client
 * Handles communication with GLA Planning London Datahub (Elasticsearch 7.9 API)
 */

const BASE_URL = 'https://planningdata.london.gov.uk/api-guest'
const REQUIRED_HEADER = 'be2rmRnt&'

// 35 London boroughs
export const LONDON_BOROUGHS = [
  'Barking and Dagenham',
  'Barnet',
  'Bexley',
  'Brent',
  'Bromley',
  'Camden',
  'City of London',
  'Croydon',
  'Ealing',
  'Enfield',
  'Greenwich',
  'Hackney',
  'Hammersmith and Fulham',
  'Haringey',
  'Harrow',
  'Havering',
  'Hillingdon',
  'Hounslow',
  'Islington',
  'Kensington and Chelsea',
  'Kingston upon Thames',
  'Lambeth',
  'Lewisham',
  'Merton',
  'Newham',
  'Redbridge',
  'Richmond upon Thames',
  'Southwark',
  'Sutton',
  'Tower Hamlets',
  'Waltham Forest',
  'Wandsworth',
  'Westminster',
  'London Legacy Development Corporation',
  'Old Oak and Park Royal Development Corporation'
]

/**
 * Search planning applications for a specific borough
 * @param {string} boroughName - Borough name to search
 * @param {string} dateFrom - Start date (DD/MM/YYYY)
 * @param {string} dateTo - End date (DD/MM/YYYY)
 * @param {number} from - Pagination offset (default 0)
 * @param {number} size - Number of results (default 100, max 10000)
 * @returns {Promise<Object>} Search results
 */
export async function searchApplications(boroughName, dateFrom, dateTo, from = 0, size = 100) {
  try {
    const query = {
      query: {
        bool: {
          must: [
            { term: { "lpa_name.raw": boroughName } },
            {
              range: {
                valid_date: {
                  gte: dateFrom,
                  lte: dateTo,
                  format: "dd/MM/yyyy"
                }
              }
            }
          ]
        }
      },
      from,
      size
      // Remove _source filter to get all 52 fields from Planning London Datahub
    }

    const response = await fetch(`${BASE_URL}/applications/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-AllowRequest': REQUIRED_HEADER
      },
      body: JSON.stringify(query)
    })

    if (!response.ok) {
      throw new Error(`Failed to search applications: ${response.status}`)
    }

    const data = await response.json()

    if (data.hits) {
      return {
        total: data.hits.total.value || 0,
        applications: data.hits.hits.map(hit => hit._source),
        pagination: {
          from,
          size,
          total: data.hits.total.value || 0
        }
      }
    }

    throw new Error('Invalid search response from Planning London Datahub')
  } catch (error) {
    console.error('Error searching applications:', error)
    throw error
  }
}

/**
 * Fetch a specific application by ID
 * @param {string} applicationId - Application ID (e.g., "Newham-701491")
 * @returns {Promise<Object>} Application data
 */
export async function fetchApplication(applicationId) {
  try {
    const response = await fetch(`${BASE_URL}_source/${applicationId}`, {
      headers: {
        'X-API-AllowRequest': REQUIRED_HEADER
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch application: ${response.status}`)
    }

    const data = await response.json()
    return data._source
  } catch (error) {
    console.error('Error fetching application:', error)
    throw error
  }
}

/**
 * Get all London boroughs
 * @returns {Array} Array of borough objects
 */
export function getLondonBoroughs() {
  return LONDON_BOROUGHS.map((borough, index) => ({
    id: borough.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: borough
  }))
}

/**
 * Build rich address from individual address components
 * @param {Object} pldApp - Application from Planning London Datahub
 * @returns {string} Formatted address
 */
function buildRichAddress(pldApp) {
  const components = [
    pldApp.site_number,
    pldApp.site_name,
    pldApp.street_name,
    pldApp.secondary_street_name,
    pldApp.locality
  ].filter(Boolean); // Remove null/undefined values

  if (components.length > 0) {
    return components.join(', ');
  }

  // Fallback to original address field if no components
  return pldApp.address || null;
}

/**
 * Map Planning London Datahub application to our database format
 * Maps all 52 available fields from the Planning London Datahub
 * @param {Object} pldApp - Application from Planning London Datahub
 * @returns {Object} Mapped application for database
 */
export function mapApplicationToDatabase(pldApp) {
  // Generate external_id from borough and app number
  const boroughSlug = pldApp.lpa_name ?
    pldApp.lpa_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') :
    'unknown'

  const appRef = pldApp.lpa_app_no ?
    pldApp.lpa_app_no.replace(/[^a-zA-Z0-9]/g, '_') :
    pldApp.id || 'unknown'

  // Conservative mapping - only use existing base columns + safe new columns
  return {
    // Core identification (existing columns)
    external_id: `${boroughSlug}-${appRef}`,
    lpa_id: boroughSlug,
    lpa_name: pldApp.lpa_name || 'Unknown Borough',

    // Main description - use description field as primary, fallback to proposal
    title: pldApp.description || pldApp.proposal || pldApp.development_type || 'Planning Application',

    // Rich address built from components
    address: buildRichAddress(pldApp),

    // Basic location (existing columns)
    postcode: pldApp.postcode || null,
    lat: pldApp.centroid ? parseFloat(pldApp.centroid?.coordinates?.[1]) :
         (pldApp.latitude ? parseFloat(pldApp.latitude) : null),
    lng: pldApp.centroid ? parseFloat(pldApp.centroid?.coordinates?.[0]) :
         (pldApp.longitude ? parseFloat(pldApp.longitude) : null),

    // Timeline dates (existing columns)
    date_validated: pldApp.valid_date ? convertDateFormat(pldApp.valid_date) : null,
    date_received: pldApp.consultation_start_date ? convertDateFormat(pldApp.consultation_start_date) : null,
    date_decision: pldApp.decision_date ? convertDateFormat(pldApp.decision_date) : null,

    // Decision information (existing columns)
    decision: pldApp.decision || pldApp.status || null,
    applicant_name: pldApp.applicant || null,
    agent_name: pldApp.agent || null,
    application_type: pldApp.application_type || null,
    external_link: pldApp.url_planning_app || generateExternalLink(pldApp.lpa_name, pldApp.lpa_app_no),

    // SAFE NEW RICH FIELDS - Only include if migration was successful

    // Rich address fields (check if they exist first)
    ...(pldApp.site_name && { site_name: pldApp.site_name }),
    ...(pldApp.site_number && { site_number: pldApp.site_number }),
    ...(pldApp.street_name && { street_name: pldApp.street_name }),
    ...(pldApp.locality && { locality: pldApp.locality }),
    ...(pldApp.ward && { ward: pldApp.ward }),
    ...(pldApp.uprn && { uprn: pldApp.uprn }),

    // Description and type
    ...(pldApp.description && { description: pldApp.description }),
    ...(pldApp.development_type && { development_type: pldApp.development_type }),

    // Appeal status (safe field)
    ...(pldApp.appeal_status && { appeal_status: pldApp.appeal_status }),

    // Links and references
    ...(pldApp.url_planning_app && { url_planning_app: pldApp.url_planning_app }),
    ...(pldApp.pp_id && { pp_id: pldApp.pp_id }),

    // Status
    ...(pldApp.status && { status: pldApp.status }),

    // Application details for search
    ...(pldApp.application_details && { application_details: pldApp.application_details }),

    // Sync tracking (existing column structure)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Convert date from DD/MM/YYYY to YYYY-MM-DD format
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return null

  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }

  // Return as-is if already in different format
  return dateStr
}

/**
 * Generate external link to borough planning portal
 * @param {string} boroughName - Borough name
 * @param {string} appNo - Application number
 * @returns {string} External link URL
 */
function generateExternalLink(boroughName, appNo) {
  if (!boroughName || !appNo) return null

  // Map borough names to their planning portal URLs
  const portalUrls = {
    'Camden': `https://camden.gov.uk/planning-applications`,
    'Westminster': `https://idoxpa.westminster.gov.uk/online-applications`,
    'Kensington and Chelsea': `https://www.rbkc.gov.uk/planning/searches`,
    'Hammersmith and Fulham': `https://public-access.lbhf.gov.uk/online-applications`,
    'Wandsworth': `https://planning.wandsworth.gov.uk/online-applications`,
    'Lambeth': `https://planning.lambeth.gov.uk/online-applications`,
    'Southwark': `https://planning.southwark.gov.uk/online-applications`,
    'Tower Hamlets': `https://development.towerhamlets.gov.uk/online-applications`,
    'Hackney': `https://planning.hackney.gov.uk/online-applications`,
    'Islington': `https://planning.islington.gov.uk/online-applications`,
    'Camden': `https://planning.camden.gov.uk/online-applications`,
    'Haringey': `https://www.haringey.gov.uk/planning-applications`,
    'Enfield': `https://planningandbuildingcontrol.enfield.gov.uk/online-applications`,
    'Barnet': `https://publicaccess.barnet.gov.uk/online-applications`,
    'Harrow': `https://www.harrow.gov.uk/planning-applications`,
    'Hillingdon': `https://planning.hillingdon.gov.uk/OA_HTML/planning_search.jsp`,
    'Ealing': `https://pam.ealing.gov.uk/online-applications`,
    'Hounslow': `https://planning.hounslow.gov.uk/planning_search.aspx`,
    'Richmond upon Thames': `https://www2.richmond.gov.uk/PlanData2/Planning_CaseNo.aspx`,
    'Kingston upon Thames': `https://planning.kingston.gov.uk/online-applications`,
    'Merton': `https://planning.merton.gov.uk/online-applications`,
    'Sutton': `https://secure.sutton.gov.uk/planning/search.aspx`,
    'Croydon': `https://publicaccess2.croydon.gov.uk/online-applications`,
    'Bromley': `https://searchapplications.bromley.gov.uk/online-applications`,
    'Lewisham': `https://planning.lewisham.gov.uk/online-applications`,
    'Greenwich': `https://planning.royalgreenwich.gov.uk/online-applications`,
    'Bexley': `https://pa.bexley.gov.uk/online-applications`,
    'Havering': `https://planning.havering.gov.uk/OA_HTML/planning_search.jsp`,
    'Barking and Dagenham': `https://paplan.lbbd.gov.uk/online-applications`,
    'Redbridge': `https://planning.redbridge.gov.uk/planning/search.do`,
    'Newham': `https://pa.newham.gov.uk/online-applications`,
    'Waltham Forest': `https://planning.walthamforest.gov.uk/planning-search.aspx`
  }

  const baseUrl = portalUrls[boroughName]
  if (baseUrl) {
    return `${baseUrl}?searchType=Application&applicationNumber=${encodeURIComponent(appNo)}`
  }

  // Generic London.gov.uk planning search as fallback
  return `https://www.london.gov.uk/what-we-do/planning/london-plan/london-development-database`
}

/**
 * Format date for Planning London API (DD/MM/YYYY)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDateForAPI(date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Get yesterday's date for sync operations
 * @returns {string} Yesterday in DD/MM/YYYY format
 */
export function getYesterday() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateForAPI(yesterday)
}

/**
 * Get date range for initial sync (last 6 months)
 * @returns {Object} Date range object
 */
export function getInitialSyncDateRange() {
  const today = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(today.getMonth() - 6)

  return {
    from: formatDateForAPI(sixMonthsAgo),
    to: formatDateForAPI(today)
  }
}

/**
 * Get all applications for a borough with pagination
 * @param {string} boroughName - Borough name
 * @param {string} dateFrom - Start date (DD/MM/YYYY)
 * @param {string} dateTo - End date (DD/MM/YYYY)
 * @returns {Promise<Array>} All applications
 */
export async function getAllApplicationsForBorough(boroughName, dateFrom, dateTo) {
  const allApplications = []
  let from = 0
  const size = 1000 // Max size per request
  let hasMore = true

  while (hasMore) {
    try {
      const result = await searchApplications(boroughName, dateFrom, dateTo, from, size)
      allApplications.push(...result.applications)

      from += size
      hasMore = result.applications.length === size && allApplications.length < result.total

      // Safety check to prevent infinite loops
      if (allApplications.length >= 10000) break

    } catch (error) {
      console.error(`Error fetching applications for ${boroughName}:`, error)
      break
    }
  }

  return allApplications
}