'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SavedSearch } from '@/lib/types'

interface SavedSearchWithDetails extends SavedSearch {
  filterCount: number
  filterSummary: string
}

export default function SavedSearchesPage() {
  const [user, setUser] = useState<any>(null)
  const [savedSearches, setSavedSearches] = useState<SavedSearchWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUserAndLoadSearches()
  }, [])

  const checkUserAndLoadSearches = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    await loadSavedSearches()
  }

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches')
      const data = await response.json()

      if (data.success) {
        const processedSearches = data.data.map((search: SavedSearch) => ({
          ...search,
          filterCount: getFilterCount(search.filters),
          filterSummary: getFilterSummary(search.filters)
        }))
        setSavedSearches(processedSearches)
      }
    } catch (error) {
      console.error('Error loading saved searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilterCount = (filters: any): number => {
    return Object.values(filters).filter(value =>
      value && value !== '' && value !== null
    ).length
  }

  const getFilterSummary = (filters: any): string => {
    const parts = []

    if (filters.council) parts.push(`Council: ${filters.council}`)
    if (filters.postcode) parts.push(`Postcode: ${filters.postcode}`)
    if (filters.radius) parts.push(`${filters.radius}mi radius`)
    if (filters.keyword) parts.push(`Keyword: "${filters.keyword}"`)
    if (filters.decision) parts.push(`Status: ${filters.decision}`)
    if (filters.date_from) parts.push(`From: ${filters.date_from}`)
    if (filters.date_to) parts.push(`To: ${filters.date_to}`)

    return parts.length > 0 ? parts.slice(0, 3).join(', ') + (parts.length > 3 ? '...' : '') : 'No filters'
  }

  const deleteSavedSearch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setSavedSearches(prev => prev.filter(search => search.id !== id))
      } else {
        alert(data.error || 'Failed to delete saved search')
      }
    } catch (error) {
      console.error('Error deleting saved search:', error)
      alert('Failed to delete saved search')
    } finally {
      setDeleting(null)
    }
  }

  const runSearch = (search: SavedSearch) => {
    const params = new URLSearchParams()
    Object.entries(search.filters).forEach(([key, value]) => {
      if (value) params.set(key, value as string)
    })

    router.push(`/dashboard/search?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading saved searches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">PR</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Planning Radar</h1>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Dashboard
              </Link>
              <Link href="/dashboard/search" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Search
              </Link>
              <Link href="/dashboard/saved-searches" className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-4 -mb-4 transition-all duration-200">
                Saved Searches
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.email?.split('@')[0]}
                  </div>
                </div>
              </div>

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700 p-1 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Searches</h1>
              <p className="text-gray-600">Manage and re-run your saved search criteria.</p>
            </div>
            <Link
              href="/dashboard/search"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              New Search
            </Link>
          </div>
        </div>

        {/* Saved Searches List */}
        {savedSearches.length > 0 ? (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div key={search.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {search.name}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {search.filterCount} filter{search.filterCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {search.filterSummary}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span>Created {new Date(search.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => runSearch(search)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Run Search
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(search.id)}
                      disabled={deleting === search.id}
                      className="text-gray-400 hover:text-red-600 p-2 disabled:opacity-50"
                      title="Delete saved search"
                    >
                      {deleting === search.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Filter Details */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {Object.entries(search.filters).map(([key, value]) => {
                      if (!value) return null

                      const labels: Record<string, string> = {
                        council: 'Council',
                        postcode: 'Postcode',
                        radius: 'Radius',
                        keyword: 'Keyword',
                        decision: 'Status',
                        date_from: 'From Date',
                        date_to: 'To Date'
                      }

                      return (
                        <div key={key} className="bg-gray-50 px-3 py-2 rounded">
                          <span className="font-medium text-gray-700">{labels[key] || key}:</span>
                          <span className="ml-1 text-gray-600">
                            {key === 'radius' ? `${value} miles` : value as string}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches yet</h3>
            <p className="text-gray-500 mb-6">
              Save your search criteria to quickly re-run searches with the same filters.
            </p>
            <Link
              href="/dashboard/search"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Search
            </Link>
          </div>
        )}

        {/* Pro/Premium Upgrade Notice */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Maximize Your Saved Searches</h3>
              <p className="text-blue-800 mb-4">
                Upgrade to Pro for 5 saved searches or Premium for unlimited saved searches plus advanced features like CSV export and applicant tracking.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}