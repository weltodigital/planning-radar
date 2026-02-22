import { Plan, PlanLimits } from '@/lib/types'

export function getPlanLimits(plan: Plan): PlanLimits {
  const limits = {
    free_trial: {
      maxResults: 10,
      historyDays: 7,
      keywordFilters: false,
      fullDetail: false,
      maxSavedSearches: 0,
      csvExport: false,
      applicantSearch: false,
    },
    pro: {
      maxResults: null, // unlimited
      historyDays: 365,
      keywordFilters: true,
      fullDetail: true,
      maxSavedSearches: 5,
      csvExport: false,
      applicantSearch: false,
    },
    premium: {
      maxResults: null, // unlimited
      historyDays: null, // unlimited
      keywordFilters: true,
      fullDetail: true,
      maxSavedSearches: null, // unlimited
      csvExport: true,
      applicantSearch: true,
    },
    expired: {
      maxResults: 5,
      historyDays: 7,
      keywordFilters: false,
      fullDetail: false,
      maxSavedSearches: 0,
      csvExport: false,
      applicantSearch: false,
    },
  }

  return limits[plan]
}

export function getPlanDisplayName(plan: Plan): string {
  const names = {
    free_trial: 'Free Trial',
    pro: 'Pro',
    premium: 'Premium',
    expired: 'Expired',
  }

  return names[plan]
}

export function getPlanColor(plan: Plan): string {
  const colors = {
    free_trial: 'bg-blue-100 text-blue-800',
    pro: 'bg-green-100 text-green-800',
    premium: 'bg-purple-100 text-purple-800',
    expired: 'bg-gray-100 text-gray-800',
  }

  return colors[plan]
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) < new Date()
}

export function getDaysUntilTrialExpires(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const today = new Date()
  const trialEnd = new Date(trialEndsAt)
  const diffTime = trialEnd.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function canAccessFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan)
  const featureValue = limits[feature]

  if (typeof featureValue === 'boolean') {
    return featureValue
  }

  if (typeof featureValue === 'number') {
    return featureValue > 0
  }

  return featureValue !== null
}