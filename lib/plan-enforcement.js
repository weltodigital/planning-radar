import { createServiceClient } from './supabase/pages-client'

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    maxResults: 10,
    historyDays: 7,
    savedSearches: 0,
    csvExport: false,
    applicantSearch: false,
    keywordSearch: false
  },
  pro: {
    maxResults: Infinity,
    historyDays: 365,
    savedSearches: 5,
    csvExport: false,
    applicantSearch: false,
    keywordSearch: true
  },
  premium: {
    maxResults: Infinity,
    historyDays: Infinity,
    savedSearches: Infinity,
    csvExport: true,
    applicantSearch: true,
    keywordSearch: true
  }
}

// Cache for user plans (5 minute cache)
const planCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get user's current plan and status
 * @param {string} userId - Supabase user ID
 * @returns {Promise<{plan: string, status: string, limits: object}>}
 */
export async function getUserPlan(userId) {
  if (!userId) {
    return {
      plan: 'free',
      status: 'active',
      limits: PLAN_LIMITS.free
    }
  }

  // Check cache first
  const cacheKey = `plan_${userId}`
  const cached = planCache.get(cacheKey)
  if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
    return cached.data
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, trial_ends_at, status, current_period_end')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // No subscription found, default to free
      const result = {
        plan: 'free',
        status: 'active',
        limits: PLAN_LIMITS.free
      }

      // Cache the result
      planCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      return result
    }

    let effectivePlan = data.plan
    let effectiveStatus = data.status

    // Check if free trial has expired
    if (data.plan === 'free_trial' && data.trial_ends_at) {
      const trialEnd = new Date(data.trial_ends_at)
      if (trialEnd < new Date()) {
        effectivePlan = 'free'
        effectiveStatus = 'expired'
      }
    }

    // Check if paid subscription has expired
    if (data.current_period_end && data.status === 'active') {
      const periodEnd = new Date(data.current_period_end)
      if (periodEnd < new Date()) {
        effectiveStatus = 'past_due'
      }
    }

    // If subscription is not active, downgrade to free
    if (effectiveStatus !== 'active' && effectiveStatus !== 'trialing') {
      effectivePlan = 'free'
    }

    // Map plan names (database uses free_trial, but we want free for limits)
    const planForLimits = effectivePlan === 'free_trial' ? 'free' : effectivePlan

    const result = {
      plan: planForLimits,
      status: effectiveStatus,
      limits: PLAN_LIMITS[planForLimits] || PLAN_LIMITS.free,
      trial_ends_at: data.trial_ends_at,
      current_period_end: data.current_period_end
    }

    // Cache the result
    planCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result

  } catch (error) {
    console.error('Error getting user plan:', error)

    // Return free plan on error
    const result = {
      plan: 'free',
      status: 'active',
      limits: PLAN_LIMITS.free
    }

    return result
  }
}

/**
 * Check if user can perform a specific action
 * @param {string} userId - Supabase user ID
 * @param {string} action - Action to check (csvExport, applicantSearch, keywordSearch)
 * @returns {Promise<{allowed: boolean, plan: string, message?: string}>}
 */
export async function checkPlanPermission(userId, action) {
  const userPlan = await getUserPlan(userId)

  const allowed = userPlan.limits[action] === true

  return {
    allowed,
    plan: userPlan.plan,
    status: userPlan.status,
    message: allowed ? undefined : `${action} requires ${action === 'csvExport' ? 'Premium' : action === 'keywordSearch' ? 'Pro or Premium' : 'Premium'} plan`
  }
}

/**
 * Apply plan limits to search query parameters
 * @param {string} userId - Supabase user ID
 * @param {object} searchParams - Search parameters
 * @returns {Promise<{params: object, plan: string, limitsApplied: boolean}>}
 */
export async function applyPlanLimits(userId, searchParams) {
  const userPlan = await getUserPlan(userId)
  const limits = userPlan.limits

  let limitsApplied = false
  const modifiedParams = { ...searchParams }

  // Apply result limit
  if (limits.maxResults !== Infinity) {
    const requestedLimit = parseInt(searchParams.limit) || 10
    if (requestedLimit > limits.maxResults) {
      modifiedParams.limit = limits.maxResults
      limitsApplied = true
    }
  }

  // Apply history limit (date filtering)
  if (limits.historyDays !== Infinity) {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() - limits.historyDays)

    // If no date_from is specified, or it's older than allowed, restrict it
    if (!searchParams.date_from) {
      modifiedParams.date_from = maxDate.toISOString().split('T')[0]
      limitsApplied = true
    } else {
      const requestedDate = new Date(searchParams.date_from)
      if (requestedDate < maxDate) {
        modifiedParams.date_from = maxDate.toISOString().split('T')[0]
        limitsApplied = true
      }
    }
  }

  // Check keyword search permission
  if (searchParams.keyword && !limits.keywordSearch) {
    delete modifiedParams.keyword
    limitsApplied = true
  }

  return {
    params: modifiedParams,
    plan: userPlan.plan,
    status: userPlan.status,
    limitsApplied,
    limits: userPlan.limits
  }
}

/**
 * Clear plan cache for a user (useful after subscription changes)
 * @param {string} userId - Supabase user ID
 */
export function clearPlanCache(userId) {
  if (userId) {
    planCache.delete(`plan_${userId}`)
  }
}

/**
 * Get plan display information
 * @param {string} plan - Plan name
 * @returns {object} Plan display info
 */
export function getPlanDisplayInfo(plan) {
  const displayInfo = {
    free: {
      name: 'Free',
      color: 'gray',
      badge: 'Free'
    },
    pro: {
      name: 'Pro',
      color: 'blue',
      badge: 'Pro'
    },
    premium: {
      name: 'Premium',
      color: 'purple',
      badge: 'Premium'
    }
  }

  return displayInfo[plan] || displayInfo.free
}