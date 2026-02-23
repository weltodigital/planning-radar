/**
 * Data Sync Utilities for Planning Radar
 * Handles syncing planning application data from the Planning API to Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { createPlanningApiClient, PlanningApiApplication, formatApiDate, parseApiDate, normalizePostcode } from '@/lib/planning-api'
import { geocodePostcodesBatch } from '@/lib/geocode'
import { PlanningApplication } from '@/lib/types'

export interface SyncResult {
  lpaId: string
  lpaName: string
  success: boolean
  applicationsFetched: number
  applicationsInserted: number
  applicationsUpdated: number
  error?: string
  duration: number
}

export interface SyncSummary {
  totalLPAs: number
  successfulLPAs: number
  failedLPAs: number
  totalApplicationsFetched: number
  totalApplicationsInserted: number
  totalApplicationsUpdated: number
  duration: number
  errors: string[]
}

/**
 * Get the last sync date for an LPA, or default to yesterday
 */
async function getLastSyncDate(lpaId: string): Promise<string> {
  try {
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
      .from('lpa_sync_log')
      .select('last_synced_at')
      .eq('lpa_id', lpaId)
      .eq('status', 'success')
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single()

    if (!error && data) {
      return (data as any).last_synced_at.split('T')[0] // Return just the date part
    }
  } catch (error) {
    console.warn(`Could not get last sync date for ${lpaId}:`, error)
  }

  // Default to yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatApiDate(yesterday)
}

/**
 * Convert Planning API application to database format
 */
function convertApiApplicationToDb(apiApp: PlanningApiApplication): Omit<PlanningApplication, 'id' | 'location' | 'created_at' | 'updated_at'> {
  return {
    external_id: apiApp.keyval,
    lpa_id: apiApp.lpa_id,
    lpa_name: apiApp.lpa_name,
    title: apiApp.title,
    address: apiApp.address || undefined,
    postcode: apiApp.postcode ? normalizePostcode(apiApp.postcode) : null,
    lat: apiApp.lat ? Number(apiApp.lat) : null,
    lng: apiApp.lng ? Number(apiApp.lng) : null,
    date_validated: apiApp.validated ? parseApiDate(apiApp.validated)?.toISOString().split('T')[0] : null,
    date_received: apiApp.received ? parseApiDate(apiApp.received)?.toISOString().split('T')[0] : null,
    date_decision: apiApp.decision_date ? parseApiDate(apiApp.decision_date)?.toISOString().split('T')[0] : null,
    decision: apiApp.decision || null,
    applicant_name: apiApp.applicant || null,
    agent_name: apiApp.agent || null,
    application_type: apiApp.type || null,
    external_link: apiApp.externalLink || null,
  }
}

/**
 * Sync applications for a single LPA
 */
export async function syncLPAApplications(
  lpaId: string,
  lpaName: string,
  dateFrom?: string,
  dateTo?: string
): Promise<SyncResult> {
  const startTime = Date.now()

  const result: SyncResult = {
    lpaId,
    lpaName,
    success: false,
    applicationsFetched: 0,
    applicationsInserted: 0,
    applicationsUpdated: 0,
    duration: 0,
  }

  try {
    const planningApi = createPlanningApiClient()
    const supabase = await createServiceRoleClient()

    // Determine date range
    const syncDateFrom = dateFrom || await getLastSyncDate(lpaId)
    const syncDateTo = dateTo || formatApiDate(new Date())

    console.log(`Syncing ${lpaName} (${lpaId}) from ${syncDateFrom} to ${syncDateTo}`)

    // First, get the count (free) to see if there are any applications
    const applicationCount = await planningApi.getApplicationsCount({
      lpaId,
      dateFrom: syncDateFrom,
      dateTo: syncDateTo
    })

    result.applicationsFetched = applicationCount

    if (applicationCount === 0) {
      console.log(`No applications found for ${lpaName}`)
      result.success = true
      result.duration = Date.now() - startTime
      await logSyncResult(result)
      return result
    }

    console.log(`Found ${applicationCount} applications for ${lpaName} - skipping full data sync (would require credits)`)

    // For now, we'll just log the count and mark as successful
    // TODO: When we have credits, fetch full application data with:
    // const applications = await planningApi.getApplicationsWithData({
    //   lpaId,
    //   dateFrom: syncDateFrom,
    //   dateTo: syncDateTo
    // })

    result.success = true

  } catch (error) {
    console.error(`Error syncing ${lpaName}:`, error)
    result.error = error instanceof Error ? error.message : String(error)
  }

  result.duration = Date.now() - startTime
  await logSyncResult(result)
  return result
}

/**
 * Log sync result to database
 */
async function logSyncResult(result: SyncResult): Promise<void> {
  try {
    const supabase = await createServiceRoleClient()

    await supabase
      .from('lpa_sync_log')
      .insert({
        lpa_id: result.lpaId,
        lpa_name: result.lpaName,
        applications_fetched: result.applicationsFetched,
        status: result.success ? 'success' : 'error'
      })
  } catch (error) {
    console.error('Error logging sync result:', error)
  }
}

/**
 * Sync applications for multiple LPAs
 */
export async function syncMultipleLPAs(
  lpaIds: string[],
  options: {
    dateFrom?: string
    dateTo?: string
    delayMs?: number // Delay between LPA requests to respect rate limits
  } = {}
): Promise<SyncSummary> {
  const startTime = Date.now()
  const { dateFrom, dateTo, delayMs = 500 } = options

  const summary: SyncSummary = {
    totalLPAs: lpaIds.length,
    successfulLPAs: 0,
    failedLPAs: 0,
    totalApplicationsFetched: 0,
    totalApplicationsInserted: 0,
    totalApplicationsUpdated: 0,
    duration: 0,
    errors: []
  }

  try {
    const planningApi = createPlanningApiClient()

    // Get LPA names
    const allLPAs = await planningApi.fetchLPAs()
    const lpaMap = new Map(allLPAs.map(lpa => [lpa.id, lpa.name]))

    console.log(`Starting sync for ${lpaIds.length} LPAs...`)

    for (let i = 0; i < lpaIds.length; i++) {
      const lpaId = lpaIds[i]
      const lpaName = lpaMap.get(lpaId) || lpaId

      try {
        const result = await syncLPAApplications(lpaId, lpaName, dateFrom, dateTo)

        if (result.success) {
          summary.successfulLPAs++
          summary.totalApplicationsFetched += result.applicationsFetched
          summary.totalApplicationsInserted += result.applicationsInserted
          summary.totalApplicationsUpdated += result.applicationsUpdated
        } else {
          summary.failedLPAs++
          if (result.error) {
            summary.errors.push(`${lpaName}: ${result.error}`)
          }
        }

        // Progress logging
        console.log(`Progress: ${i + 1}/${lpaIds.length} LPAs synced`)

        // Rate limiting delay
        if (i < lpaIds.length - 1 && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }

      } catch (error) {
        console.error(`Error processing ${lpaName}:`, error)
        summary.failedLPAs++
        summary.errors.push(`${lpaName}: ${error}`)
      }
    }

  } catch (error) {
    console.error('Error in bulk LPA sync:', error)
    summary.errors.push(`Bulk sync error: ${error}`)
  }

  summary.duration = Date.now() - startTime

  console.log('Sync Summary:', {
    ...summary,
    errors: summary.errors.length + ' errors'
  })

  return summary
}

/**
 * Sync all available LPAs (use with caution - this could take hours!)
 */
export async function syncAllLPAs(options: {
  dateFrom?: string
  dateTo?: string
  delayMs?: number
  maxLPAs?: number // Limit for testing
} = {}): Promise<SyncSummary> {
  try {
    const planningApi = createPlanningApiClient()
    const allLPAs = await planningApi.fetchLPAs()

    let lpaIds = allLPAs.map(lpa => lpa.id)

    // Apply limit if specified (for testing)
    if (options.maxLPAs && options.maxLPAs > 0) {
      lpaIds = lpaIds.slice(0, options.maxLPAs)
      console.log(`Limited sync to first ${options.maxLPAs} LPAs`)
    }

    return syncMultipleLPAs(lpaIds, options)
  } catch (error) {
    console.error('Error fetching LPAs for sync:', error)
    return {
      totalLPAs: 0,
      successfulLPAs: 0,
      failedLPAs: 1,
      totalApplicationsFetched: 0,
      totalApplicationsInserted: 0,
      totalApplicationsUpdated: 0,
      duration: 0,
      errors: [`Failed to fetch LPAs: ${error}`]
    }
  }
}

/**
 * Get sync statistics from the database
 */
export async function getSyncStats(): Promise<{
  totalApplications: number
  totalLPAs: number
  lastSyncDate: string | null
  recentSyncs: Array<{
    lpaName: string
    lastSynced: string
    applicationsFetched: number
    status: string
  }>
}> {
  try {
    const supabase = await createServiceRoleClient()

    // Get total applications
    const { count: totalApplications } = await supabase
      .from('planning_applications')
      .select('*', { count: 'exact', head: true })

    // Get unique LPAs
    const { count: totalLPAs } = await supabase
      .from('planning_applications')
      .select('lpa_name', { count: 'exact', head: true })

    // Get last sync date
    const { data: lastSync } = await supabase
      .from('lpa_sync_log')
      .select('last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single()

    // Get recent syncs
    const { data: recentSyncs } = await supabase
      .from('lpa_sync_log')
      .select('lpa_name, last_synced_at, applications_fetched, status')
      .order('last_synced_at', { ascending: false })
      .limit(10)

    return {
      totalApplications: totalApplications || 0,
      totalLPAs: totalLPAs || 0,
      lastSyncDate: lastSync?.last_synced_at || null,
      recentSyncs: recentSyncs?.map(sync => ({
        lpaName: sync.lpa_name,
        lastSynced: sync.last_synced_at,
        applicationsFetched: sync.applications_fetched,
        status: sync.status
      })) || []
    }
  } catch (error) {
    console.error('Error getting sync stats:', error)
    return {
      totalApplications: 0,
      totalLPAs: 0,
      lastSyncDate: null,
      recentSyncs: []
    }
  }
}