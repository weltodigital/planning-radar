/**
 * Planning API Client for api.planning.org.uk
 * Handles all interactions with the UK Planning API
 */

export interface LPA {
  id: string
  name: string
  application_count: string
}

export interface PlanningApiApplication {
  lpa_id: string
  lpa_name: string
  keyval: string // external_id
  externalLink?: string
  title: string
  address?: string
  postcode?: string
  lat?: string
  lng?: string
  validated?: string // date_validated
  received?: string // date_received
  decision?: string
  decision_date?: string
  applicant?: string // applicant_name
  agent?: string // agent_name
  type?: string // application_type
}

export interface PlanningApiResponse<T> {
  request: {
    api_endpoint: string
    ip_address: string
    datetime: string
    key?: string
  }
  response: {
    api_version: string
    status: 'OK' | 'ERROR'
    data?: T
    lpa_count?: number
    application_count?: number
    message?: string
    error?: string
  }
}

export class PlanningApiClient {
  private apiKey: string
  private baseUrl = 'https://api.planning.org.uk/v1'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Planning API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Generate a new API key with email address
   */
  static async generateApiKey(email: string): Promise<string> {
    try {
      const response = await fetch(`https://api.planning.org.uk/v1/generatekey?email=${encodeURIComponent(email)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: PlanningApiResponse<{ key: string }> = await response.json()

      if (data.response.status === 'OK' && data.response.data?.key) {
        return data.response.data.key
      }

      throw new Error(data.response.message || 'Failed to generate API key')
    } catch (error) {
      console.error('Error generating Planning API key:', error)
      throw error
    }
  }

  /**
   * Fetch all Local Planning Authorities (LPAs)
   */
  async fetchLPAs(): Promise<LPA[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lpas?key=${this.apiKey}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: PlanningApiResponse<LPA[]> = await response.json()

      if (data.response.status === 'OK' && data.response.data) {
        return data.response.data
      }

      throw new Error(data.response.error || 'Failed to fetch LPAs')
    } catch (error) {
      console.error('Error fetching LPAs:', error)
      throw error
    }
  }

  /**
   * Search planning applications (free search, no credits used)
   */
  async searchApplications(params: {
    lpaId: string
    dateFrom: string // YYYY-MM-DD
    dateTo: string // YYYY-MM-DD
    returnData?: boolean // Set to true to get full data (costs credits)
  }): Promise<{
    applications: PlanningApiApplication[]
    applicationCount: number
  }> {
    try {
      const searchParams = new URLSearchParams({
        key: this.apiKey,
        lpa_id: params.lpaId,
        date_from: params.dateFrom,
        date_to: params.dateTo,
      })

      // Add return_data parameter if requested (this costs credits)
      if (params.returnData) {
        searchParams.append('return_data', '1')
      }

      const response = await fetch(`${this.baseUrl}/search?${searchParams}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: PlanningApiResponse<PlanningApiApplication[]> = await response.json()

      if (data.response.status === 'OK') {
        return {
          applications: data.response.data || [],
          applicationCount: data.response.application_count || 0
        }
      }

      throw new Error(data.response.error || 'Failed to search applications')
    } catch (error) {
      console.error('Error searching applications:', error)
      throw error
    }
  }

  /**
   * Get applications for a specific LPA within a date range (with full data)
   */
  async getApplicationsWithData(params: {
    lpaId: string
    dateFrom: string
    dateTo: string
  }): Promise<PlanningApiApplication[]> {
    const result = await this.searchApplications({
      ...params,
      returnData: true
    })
    return result.applications
  }

  /**
   * Get applications count for a specific LPA and date range (free)
   */
  async getApplicationsCount(params: {
    lpaId: string
    dateFrom: string
    dateTo: string
  }): Promise<number> {
    const result = await this.searchApplications({
      ...params,
      returnData: false
    })
    return result.applicationCount
  }

  /**
   * Get applications for the last N days
   */
  async getRecentApplications(lpaId: string, days: number = 7): Promise<PlanningApiApplication[]> {
    const dateTo = new Date().toISOString().split('T')[0] // Today
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0] // N days ago

    return this.getApplicationsWithData({
      lpaId,
      dateFrom,
      dateTo
    })
  }
}

/**
 * Create a planning API client with the configured API key
 */
export function createPlanningApiClient(): PlanningApiClient {
  const apiKey = process.env.PLANNING_API_KEY

  if (!apiKey) {
    throw new Error('PLANNING_API_KEY environment variable is required')
  }

  return new PlanningApiClient(apiKey)
}

/**
 * Helper to format dates for the Planning API (YYYY-MM-DD)
 */
export function formatApiDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Helper to parse API date strings to Date objects
 */
export function parseApiDate(dateString: string): Date | null {
  if (!dateString) return null

  // Handle different date formats from the API
  const cleanDate = dateString.trim()

  // Try parsing as ISO date first
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return new Date(cleanDate + 'T00:00:00.000Z')
  }

  // Try parsing as other common formats
  const parsed = new Date(cleanDate)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Helper to normalize postcode format (uppercase with proper spacing)
 */
export function normalizePostcode(postcode: string): string {
  if (!postcode) return postcode

  // Remove all spaces and convert to uppercase
  const clean = postcode.replace(/\s+/g, '').toUpperCase()

  // Add space before the last 3 characters if it's a valid UK postcode format
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(clean)) {
    return clean.slice(0, -3) + ' ' + clean.slice(-3)
  }

  return clean
}