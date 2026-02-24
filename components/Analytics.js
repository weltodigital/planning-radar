import Script from 'next/script'

export default function Analytics() {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <Script
      defer
      data-domain="planningradar.com"
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  )
}

// Helper function to track custom events
export function trackEvent(eventName, props = {}) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props })
  }
}

// Common event tracking functions
export const analytics = {
  // Track user signup
  trackSignup: (plan = 'free_trial') => {
    trackEvent('Signup', { plan })
  },

  // Track search usage
  trackSearch: (searchType, userPlan = 'free_trial') => {
    trackEvent('Search', { type: searchType, plan: userPlan })
  },

  // Track upgrade actions
  trackUpgradeClick: (fromPlan, toPlan, source) => {
    trackEvent('Upgrade Click', { from: fromPlan, to: toPlan, source })
  },

  // Track feature usage
  trackFeatureUse: (feature, userPlan) => {
    trackEvent('Feature Use', { feature, plan: userPlan })
  },

  // Track CSV exports
  trackExport: (recordCount, userPlan) => {
    trackEvent('CSV Export', { records: recordCount, plan: userPlan })
  },

  // Track saved search creation
  trackSaveSearch: (userPlan) => {
    trackEvent('Save Search', { plan: userPlan })
  },

  // Track pricing page visits
  trackPricingView: (source = 'direct') => {
    trackEvent('Pricing View', { source })
  },

  // Track dashboard usage
  trackDashboardView: (userPlan) => {
    trackEvent('Dashboard View', { plan: userPlan })
  }
}