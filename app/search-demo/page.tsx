'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PlanInfo {
  plan: string
  limits: {
    maxResults: number | null
    historyDays: number | null
    keywordFilters: boolean
    csvExport: boolean
    applicantSearch: boolean
  }
}

export default function SearchDemoPage() {
  const [user, setUser] = useState<any>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchParams, setSearchParams] = useState({
    council: '',
    keyword: '',
    postcode: '',
    radius: '1'
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)

    // Get user plan info by making a search API call
    try {
      const response = await fetch('/api/search/counts?council=bristol&days_back=1')
      const data = await response.json()
      if (data.success && data.data.planInfo) {
        setPlanInfo({
          plan: data.data.planInfo.plan,
          limits: {
            maxResults: 100, // This would come from the actual plan limits
            historyDays: data.data.planInfo.dateRestricted ? 7 : null,
            keywordFilters: data.data.planInfo.plan !== 'free_trial',
            csvExport: data.data.planInfo.plan === 'premium',
            applicantSearch: data.data.planInfo.plan === 'premium'
          }
        })
      }
    } catch (error) {
      console.error('Error getting plan info:', error)
    }
  }

  const handleSearch = async (endpoint: string, params: any = {}) => {
    setSearchLoading(true)
    setSearchResults(null)

    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${endpoint}?${queryString}`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      setSearchResults({ success: false, error: 'Request failed' })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleBasicSearch = () => {
    const params: any = {}
    if (searchParams.council) params.council = searchParams.council
    if (searchParams.postcode) params.postcode = searchParams.postcode
    if (searchParams.radius) params.radius = searchParams.radius
    if (searchParams.keyword) params.keyword = searchParams.keyword

    handleSearch('/api/search', { ...params, limit: 5 })
  }

  const handleApplicantSearch = () => {
    if (!searchParams.keyword) {
      setSearchResults({ success: false, error: 'Please enter a name to search for' })
      return
    }
    handleSearch('/api/search/applicant', { query: searchParams.keyword, limit: 5 })
  }

  const handleCsvExport = () => {
    const params: any = {}
    if (searchParams.council) params.council = searchParams.council
    if (searchParams.postcode) params.postcode = searchParams.postcode
    if (searchParams.radius) params.radius = searchParams.radius

    window.open(`/api/export/csv?${new URLSearchParams(params).toString()}`, '_blank')
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
      {/* Modern Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Planning Radar</h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Dashboard
              </a>
              <a href="/search-demo" className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-4 -mb-4 transition-all duration-200">
                Search
              </a>
              <a href="/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Pricing
              </a>
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Planning Applications</h1>
          <p className="text-gray-600">Find planning applications across 268+ UK councils with advanced search filters.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan</h2>
              {planInfo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Current Plan</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      planInfo.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                      planInfo.plan === 'pro' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {planInfo.plan.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Searches Used</span>
                      <span className="text-gray-900 font-medium">0 / {planInfo.limits.maxResults || '∞'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Plan Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            planInfo.limits.keywordFilters ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-sm text-gray-700">Keyword Search</span>
                        </div>
                        {planInfo.limits.keywordFilters ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            planInfo.limits.applicantSearch ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-sm text-gray-700">Applicant Search</span>
                        </div>
                        {planInfo.limits.applicantSearch ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-xs text-orange-600 font-medium mr-1">Premium</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            planInfo.limits.csvExport ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-sm text-gray-700">CSV Export</span>
                        </div>
                        {planInfo.limits.csvExport ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-xs text-orange-600 font-medium mr-1">Premium</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-3 bg-blue-500"></div>
                          <span className="text-sm text-gray-700">History Access</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {planInfo.limits.historyDays ? `${planInfo.limits.historyDays} days` : 'Full history'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {planInfo.plan !== 'premium' && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-primary mb-2">Upgrade Available</h4>
                      <p className="text-xs text-gray-600 mb-3">
                        {planInfo.plan === 'free_trial' ? 'Unlock unlimited searches and advanced features' : 'Get premium features like applicant search and CSV export'}
                      </p>
                      <a href="/pricing" className="text-xs font-medium text-primary hover:underline">
                        View Plans →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Council/LPA Name
                  </label>
                  <input
                    type="text"
                    value={searchParams.council}
                    onChange={(e) => setSearchParams({...searchParams, council: e.target.value})}
                    placeholder="e.g. bristol, cambridge"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode (radius search)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchParams.postcode}
                      onChange={(e) => setSearchParams({...searchParams, postcode: e.target.value})}
                      placeholder="e.g. BS1 1AA"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    <select
                      value={searchParams.radius}
                      onChange={(e) => setSearchParams({...searchParams, radius: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="0.5">0.5mi</option>
                      <option value="1">1mi</option>
                      <option value="3">3mi</option>
                      <option value="5">5mi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword Search
                    {!planInfo?.limits.keywordFilters && (
                      <span className="text-xs text-red-600 ml-1">(Pro+ only)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={searchParams.keyword}
                    onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})}
                    placeholder="e.g. extension, garage"
                    disabled={!planInfo?.limits.keywordFilters}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={handleBasicSearch}
                  disabled={searchLoading}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {searchLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Applications
                    </div>
                  )}
                </button>

                <button
                  onClick={handleApplicantSearch}
                  disabled={searchLoading || !planInfo?.limits.applicantSearch}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 relative"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Applicant Search
                  </div>
                  {!planInfo?.limits.applicantSearch && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Premium</span>
                  )}
                </button>

                <button
                  onClick={handleCsvExport}
                  disabled={!planInfo?.limits.csvExport}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 relative"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </div>
                  {!planInfo?.limits.csvExport && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Premium</span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Search Results</h3>
                </div>

                {searchResults.success ? (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 font-medium">{searchResults.message}</p>
                    </div>
                    {searchResults.data?.applications && searchResults.data.applications.length > 0 ? (
                      <div className="space-y-6">
                        {searchResults.data.applications.slice(0, 3).map((app: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-gray-50/50">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-semibold text-gray-900 text-lg">{app.title || 'No title available'}</h4>
                              {app.decision && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  app.decision.toLowerCase().includes('approved') ? 'bg-green-100 text-green-800' :
                                  app.decision.toLowerCase().includes('refused') ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {app.decision}
                                </span>
                              )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="space-y-2">
                                <div className="flex items-start">
                                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span><strong>Address:</strong> {app.address || 'No address available'}</span>
                                </div>
                                <div className="flex items-start">
                                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span><strong>Council:</strong> {app.lpa_name || 'Unknown'}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start">
                                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m6 5a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h12a2 2 0 012 2v6z" />
                                  </svg>
                                  <span><strong>Date:</strong> {app.date_validated || 'Unknown'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {searchResults.data.total > 3 && (
                          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                            <p className="text-primary font-medium">
                              ...and {searchResults.data.total - 3} more results available
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Upgrade to see all results and export to CSV</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No applications found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-red-900 font-medium mb-2">Search Error</h4>
                        <p className="text-red-800">{searchResults.error}</p>
                        {searchResults.upgrade && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                            <p className="text-red-700 font-medium">Upgrade Required</p>
                            <p className="text-sm text-red-600 mt-1">
                              This feature requires <strong>{searchResults.upgrade.requiredPlan}</strong> plan.
                            </p>
                            <p className="text-sm text-red-600">
                              Your current plan: <strong>{searchResults.upgrade.currentPlan}</strong>
                            </p>
                            <a href="/pricing" className="inline-block mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                              View Pricing Plans
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}