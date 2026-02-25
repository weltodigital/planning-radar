import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { createBrowserClient } from '../../lib/supabase/pages-client'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Search state
  const [searchForm, setSearchForm] = useState({
    postcode: '',
    radius: '1',
    council: '',
    status: ''
  })
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          router.push('/login')
          return
        }

        setUser(session.user)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearching(true)
    setSearchError('')

    try {
      const params = new URLSearchParams()

      if (searchForm.postcode) params.append('postcode', searchForm.postcode)
      if (searchForm.council) params.append('council', searchForm.council)
      if (searchForm.status) params.append('status', searchForm.status)

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        if (data.upgrade_required) {
          setSearchError(data.error + ' - Upgrade to Pro to access this feature.')
        } else {
          setSearchError(data.error || 'Search failed')
        }
        return
      }

      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setSearchError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleFormChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getStatusBadgeColor = (status) => {
    return 'text-white font-medium'
  }

  const getStatusBackgroundColor = (status) => {
    const statusLower = status?.toLowerCase() || ''

    // Approved/Granted - Green #22C55E
    if (statusLower.includes('approved') || statusLower.includes('granted') ||
        statusLower.includes('consent') || statusLower.includes('permission granted')) {
      return '#22C55E'
    }

    // Refused/Rejected - Red #EF4444
    if (statusLower.includes('refused') || statusLower.includes('rejected') ||
        statusLower.includes('dismissed') || statusLower.includes('declined')) {
      return '#EF4444'
    }

    // Withdrawn - Grey #9CA3AF
    if (statusLower.includes('withdrawn') || statusLower.includes('cancelled') ||
        statusLower.includes('invalid') || statusLower.includes('lapsed')) {
      return '#9CA3AF'
    }

    // Pending/Under Consideration - Amber #F59E0B (default)
    return '#F59E0B'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Planning Radar
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Welcome back!</span>
                <span className="text-sm font-medium text-gray-900">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Search and track London planning applications</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Planning Applications</h2>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Postcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. BS1 5AH"
                  value={searchForm.postcode}
                  onChange={(e) => handleFormChange('postcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius
                </label>
                <select
                  value={searchForm.radius}
                  onChange={(e) => handleFormChange('radius', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0.5">0.5 miles</option>
                  <option value="1">1 mile</option>
                  <option value="3">3 miles</option>
                  <option value="5">5 miles</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Borough (Alternative to postcode)
                </label>
                <select
                  value={searchForm.council}
                  onChange={(e) => handleFormChange('council', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a council...</option>
                  <option value="bristol">Bristol City Council</option>
                  <option value="birmingham">Birmingham City Council</option>
                  <option value="manchester">Manchester City Council</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Status
                </label>
                <select
                  value={searchForm.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All applications</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="refused">Refused</option>
                </select>
              </div>
            </div>

            {searchError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{searchError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={searching}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search Applications'}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({searchResults.pagination.total})
              </h2>
              {searchResults.limits_applied && (
                <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  Free trial: Showing first 10 results
                </span>
              )}
            </div>

            <div className="space-y-4">
              {searchResults.applications.map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-4">
                      {/* Rich Planning Description */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {app.description || app.title}
                      </h3>
                      {/* Rich Address */}
                      <p className="text-gray-600 mb-2">{app.address}</p>
                      {app.ward && (
                        <p className="text-sm text-gray-500 mb-2">Ward: {app.ward}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {/* Status Badge */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(app.status)}`}
                        style={{ backgroundColor: getStatusBackgroundColor(app.status) }}
                      >
                        {app.status}
                      </span>
                      {/* Council Portal Link */}
                      {app.url_planning_app && (
                        <a
                          href={app.url_planning_app}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View on Council Website →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Rich Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500 border-t border-gray-100 pt-3">
                    <div>
                      <span className="font-medium">Council:</span> {app.council}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(app.date_validated).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {app.development_type || app.type || 'Planning Application'}
                    </div>
                    <div>
                      <span className="font-medium">Applicant:</span> {app.applicant || 'Not specified'}
                    </div>
                  </div>

                  {/* Additional Rich Fields */}
                  {(app.decision_target_date || app.appeal_status) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-500 mt-2 pt-2 border-t border-gray-50">
                      {app.decision_target_date && (
                        <div>
                          <span className="font-medium">Target Decision:</span> {new Date(app.decision_target_date).toLocaleDateString()}
                        </div>
                      )}
                      {app.appeal_status && (
                        <div>
                          <span className="font-medium">Appeal:</span> {app.appeal_status}
                        </div>
                      )}
                      {app.uprn && (
                        <div>
                          <span className="font-medium">UPRN:</span> {app.uprn}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {searchResults.pagination.total_pages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="text-sm text-gray-500">
                  Page {searchResults.pagination.page} of {searchResults.pagination.total_pages}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trial Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                <span className="text-blue-600 font-semibold text-sm">7</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900">Free Trial Active</h3>
              <p className="text-blue-700 mb-4">
                You have 7 days remaining in your free trial. Search up to 10 results with basic filters.
              </p>
              <Link href="/pricing" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}