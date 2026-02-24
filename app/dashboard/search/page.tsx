'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PlanningApplication } from '@/lib/types'

interface SearchResults {
  applications: PlanningApplication[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface PlanInfo {
  plan: string
  limits: {
    maxResults: number | null
    historyDays: number | null
    keywordFilters: boolean
    csvExport: boolean
    applicantSearch: boolean
  }
  appliedLimits?: {
    maxResults: number
    dateRestricted: boolean
    keywordAllowed: boolean
  }
}

function SearchPageContent() {
  const [user, setUser] = useState<any>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [saving, setSaving] = useState(false)

  const [filters, setFilters] = useState({
    council: '',
    keyword: '',
    postcode: '',
    radius: '1',
    decision: '',
    date_from: '',
    date_to: ''
  })

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkUser()
    // Load filters from URL params
    loadFiltersFromUrl()
  }, [])

  useEffect(() => {
    // Update URL when filters change (debounced)
    const timer = setTimeout(() => {
      updateUrl()
    }, 500)
    return () => clearTimeout(timer)
  }, [filters])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)

    // Get user plan info
    try {
      const response = await fetch('/api/search/counts?council=bristol&limit=1')
      const data = await response.json()
      if (data.success && data.data.planInfo) {
        setPlanInfo(data.data.planInfo)
      }
    } catch (error) {
      console.error('Error getting plan info:', error)
    }
  }

  const loadFiltersFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    setFilters({
      council: params.get('council') || '',
      keyword: params.get('keyword') || '',
      postcode: params.get('postcode') || '',
      radius: params.get('radius') || '1',
      decision: params.get('decision') || '',
      date_from: params.get('date_from') || '',
      date_to: params.get('date_to') || ''
    })

    // If there are params, auto-search
    if (params.toString()) {
      handleSearch(1, true)
    }
  }

  const updateUrl = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    const newUrl = params.toString()
      ? `/dashboard/search?${params.toString()}`
      : '/dashboard/search'

    window.history.replaceState({}, '', newUrl)
  }

  const handleSearch = async (page = 1, skipLoading = false) => {
    if (!skipLoading) setSearchLoading(true)
    setCurrentPage(page)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      params.set('page', page.toString())
      params.set('limit', '20')

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data)
        if (data.data.planInfo) {
          setPlanInfo(data.data.planInfo)
        }
      } else {
        setSearchResults({
          applications: [],
          total: 0,
          page,
          limit: 20,
          hasMore: false
        })
        // Handle error display
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCsvExport = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set('limit', '1000')

    window.open(`/api/export/csv?${params.toString()}`, '_blank')
  }

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: searchName.trim(),
          filters
        })
      })

      const data = await response.json()
      if (data.success) {
        setSaveModalOpen(false)
        setSearchName('')
        // Show success message
        alert('Search saved successfully!')
      } else {
        alert(data.error || 'Failed to save search')
      }
    } catch (error) {
      console.error('Error saving search:', error)
      alert('Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  const resetFilters = () => {
    setFilters({
      council: '',
      keyword: '',
      postcode: '',
      radius: '1',
      decision: '',
      date_from: '',
      date_to: ''
    })
    setSearchResults(null)
    setCurrentPage(1)
  }

  const getStatusColor = (decision?: string) => {
    if (!decision) return 'bg-gray-100 text-gray-800'
    const d = decision.toLowerCase()
    if (d.includes('approved') || d.includes('granted')) return 'bg-green-100 text-green-800'
    if (d.includes('refused') || d.includes('rejected')) return 'bg-red-100 text-red-800'
    if (d.includes('pending') || d.includes('awaiting')) return 'bg-yellow-100 text-yellow-800'
    if (d.includes('withdrawn')) return 'bg-gray-100 text-gray-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20 sticky top-0 z-50">
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
              <Link href="/dashboard/search" className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-4 -mb-4 transition-all duration-200">
                Search
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Pricing
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {planInfo?.plan?.replace('_', ' ') || 'Loading...'}
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Planning Applications</h1>
          <p className="text-gray-600">Find planning applications across 400+ UK councils with advanced search filters.</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Search Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-4">
                {/* Council */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Council/LPA Name
                  </label>
                  <input
                    type="text"
                    value={filters.council}
                    onChange={(e) => setFilters({...filters, council: e.target.value})}
                    placeholder="e.g. bristol, cambridge"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Postcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={filters.postcode}
                      onChange={(e) => setFilters({...filters, postcode: e.target.value})}
                      placeholder="e.g. BS1 5AH"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={filters.radius}
                      onChange={(e) => setFilters({...filters, radius: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="0.5">0.5 miles</option>
                      <option value="1">1 mile</option>
                      <option value="3">3 miles</option>
                      <option value="5">5 miles</option>
                    </select>
                  </div>
                </div>

                {/* Keyword */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword Search
                    {!planInfo?.limits.keywordFilters && (
                      <span className="text-xs text-red-600 ml-1">(Pro+ only)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                    placeholder="e.g. extension, garage"
                    disabled={!planInfo?.limits.keywordFilters}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Decision */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Status
                  </label>
                  <select
                    value={filters.decision}
                    onChange={(e) => setFilters({...filters, decision: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All decisions</option>
                    <option value="approved">Approved</option>
                    <option value="refused">Refused</option>
                    <option value="pending">Pending</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  onClick={() => handleSearch(1)}
                  disabled={searchLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {searchLoading ? 'Searching...' : 'Search Applications'}
                </button>

                {searchResults && searchResults.total > 0 && (
                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Save This Search
                  </button>
                )}

                {planInfo?.limits.csvExport && (
                  <button
                    onClick={handleCsvExport}
                    disabled={!searchResults || searchResults.total === 0}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    Export CSV
                  </button>
                )}
              </div>

              {/* Plan Info */}
              {planInfo && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium capitalize">{planInfo.plan.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Results:</span>
                      <span className="font-medium">{planInfo.limits.maxResults || 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">History:</span>
                      <span className="font-medium">{planInfo.limits.historyDays ? `${planInfo.limits.historyDays}d` : 'Full'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {searchResults && (
              <>
                {/* Results Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {searchResults.total.toLocaleString()} applications found
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Page {currentPage} of {Math.ceil(searchResults.total / 20)}
                      </p>
                    </div>
                    {planInfo?.appliedLimits && (
                      <div className="text-sm text-gray-500">
                        {planInfo.appliedLimits.dateRestricted && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mr-2">
                            Date limited
                          </span>
                        )}
                        {planInfo.appliedLimits.maxResults && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Showing {planInfo.appliedLimits.maxResults} max
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                  {searchResults.applications.map((app) => (
                    <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link
                            href={`/dashboard/application/${app.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {app.title || 'Planning Application'}
                          </Link>
                        </div>
                        {app.decision && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${getStatusColor(app.decision)}`}>
                            {app.decision}
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          {app.address && (
                            <div className="flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span>{app.address}</span>
                            </div>
                          )}
                          <div className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{app.lpa_name || 'Unknown Council'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m6 5a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h12a2 2 0 012 2v6z" />
                            </svg>
                            <span>
                              {app.date_validated
                                ? new Date(app.date_validated).toLocaleDateString()
                                : 'Date unknown'
                              }
                            </span>
                          </div>
                          {app.applicant_name && (
                            <div className="flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{app.applicant_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {searchResults.total > 20 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleSearch(currentPage - 1)}
                        disabled={currentPage === 1 || searchLoading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-500">
                        Page {currentPage} of {Math.ceil(searchResults.total / 20)}
                      </span>

                      <button
                        onClick={() => handleSearch(currentPage + 1)}
                        disabled={!searchResults.hasMore || searchLoading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!searchResults && !searchLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
                <p className="text-gray-500">Enter search criteria in the filters panel to find planning applications.</p>
              </div>
            )}

            {/* No Results */}
            {searchResults && searchResults.total === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or expanding your search area.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Search Modal */}
        {saveModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Search</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. Bristol Extensions, London Offices"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSaveModalOpen(false)
                    setSearchName('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSearch}
                  disabled={!searchName.trim() || saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Search'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}