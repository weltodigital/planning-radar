/**
 * React Hooks for Property Intelligence Enrichment Data
 *
 * Provides convenient hooks for fetching and managing enrichment data
 * with proper loading states, error handling, and caching.
 */

import { useState, useEffect } from 'react'

/**
 * Hook to fetch enrichment data for a specific application
 */
export function useApplicationEnrichment(applicationReference) {
  const [enrichment, setEnrichment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!applicationReference) {
      setLoading(false)
      return
    }

    const fetchEnrichment = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/enrich/${encodeURIComponent(applicationReference)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to fetch enrichment data')
        }

        setEnrichment(data.data)
      } catch (err) {
        console.error('Enrichment fetch failed:', err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrichment()
  }, [applicationReference])

  const refresh = async () => {
    if (!applicationReference) return

    try {
      setLoading(true)
      setError(null)

      // Force fresh enrichment by bypassing cache
      const response = await fetch(`/api/enrich/${encodeURIComponent(applicationReference)}?fresh=1`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to refresh enrichment data')
      }

      setEnrichment(data.data)
    } catch (err) {
      console.error('Enrichment refresh failed:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    enrichment,
    loading,
    error,
    refresh,
    isFromCache: enrichment?.source === 'cache'
  }
}

/**
 * Hook to fetch comparable property sales data
 */
export function useComparables(postcode, type = null, months = 24) {
  const [comparables, setComparables] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!postcode) {
      setComparables([])
      setSummary(null)
      return
    }

    const fetchComparables = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          postcode,
          months: months.toString(),
          limit: '10'
        })

        if (type) {
          params.append('type', type)
        }

        const response = await fetch(`/api/comparables?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to fetch comparables')
        }

        setComparables(data.sales || [])
        setSummary(data.summary || null)
      } catch (err) {
        console.error('Comparables fetch failed:', err.message)
        setError(err.message)
        setComparables([])
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    fetchComparables()
  }, [postcode, type, months])

  return {
    comparables,
    summary,
    loading,
    error
  }
}

/**
 * Hook to manage enrichment preferences and settings
 */
export function useEnrichmentSettings() {
  const [settings, setSettings] = useState({
    autoExpand: false,
    showConfidence: true,
    highlightRisks: true,
    compactView: false
  })

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('enrichment-settings')
    if (saved) {
      try {
        setSettings({ ...settings, ...JSON.parse(saved) })
      } catch (err) {
        console.warn('Failed to load enrichment settings:', err.message)
      }
    }
  }, [])

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      localStorage.setItem('enrichment-settings', JSON.stringify(newSettings))
    } catch (err) {
      console.warn('Failed to save enrichment settings:', err.message)
    }
  }

  return {
    settings,
    updateSetting
  }
}

/**
 * Hook to track enrichment analytics and usage
 */
export function useEnrichmentAnalytics() {
  const [analytics, setAnalytics] = useState({
    viewsToday: 0,
    totalViews: 0,
    averageScore: null,
    topConstraints: []
  })

  const trackView = (applicationReference, opportunityScore) => {
    // Track enrichment panel view
    const today = new Date().toDateString()
    const views = JSON.parse(localStorage.getItem('enrichment-views') || '{}')

    if (!views[today]) views[today] = []
    views[today].push({
      reference: applicationReference,
      score: opportunityScore,
      timestamp: new Date().toISOString()
    })

    // Keep only last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    Object.keys(views).forEach(date => {
      if (new Date(date) < weekAgo) {
        delete views[date]
      }
    })

    localStorage.setItem('enrichment-views', JSON.stringify(views))

    // Update analytics
    const todayViews = views[today]?.length || 0
    const totalViews = Object.values(views).flat().length
    const scores = Object.values(views).flat().map(v => v.score).filter(Boolean)
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    setAnalytics({
      viewsToday: todayViews,
      totalViews,
      averageScore,
      topConstraints: [] // Could be enhanced to track constraint frequency
    })
  }

  return {
    analytics,
    trackView
  }
}

/**
 * Hook for bulk enrichment operations (admin/power users)
 */
export function useBatchEnrichment() {
  const [status, setStatus] = useState('idle') // 'idle', 'running', 'completed', 'error'
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const startBatch = async (applicationReferences = []) => {
    if (applicationReferences.length === 0) {
      setError('No applications provided for batch enrichment')
      return
    }

    setStatus('running')
    setProgress({ current: 0, total: applicationReferences.length })
    setResults(null)
    setError(null)

    const results = { enriched: 0, errors: 0, details: [] }

    try {
      for (let i = 0; i < applicationReferences.length; i++) {
        const ref = applicationReferences[i]

        try {
          const response = await fetch(`/api/enrich/${encodeURIComponent(ref)}`)
          const data = await response.json()

          if (response.ok) {
            results.enriched++
            results.details.push({ reference: ref, status: 'success', data: data.data })
          } else {
            results.errors++
            results.details.push({ reference: ref, status: 'error', error: data.error })
          }
        } catch (err) {
          results.errors++
          results.details.push({ reference: ref, status: 'error', error: err.message })
        }

        setProgress({ current: i + 1, total: applicationReferences.length })

        // Rate limiting delay
        if (i < applicationReferences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      setResults(results)
      setStatus('completed')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setProgress({ current: 0, total: 0 })
    setResults(null)
    setError(null)
  }

  return {
    status,
    progress,
    results,
    error,
    startBatch,
    reset,
    isRunning: status === 'running'
  }
}