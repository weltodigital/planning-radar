import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { createBrowserClient } from '../../lib/supabase/pages-client'
import { getUserPlan, getPlanDisplayInfo } from '../../lib/plan-enforcement'
import EnrichmentPanel from '../../components/EnrichmentPanel'
import MapView from '../../components/MapView'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState(null)
  const [savedSearches, setSavedSearches] = useState([])
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [managingSubscription, setManagingSubscription] = useState(false)

  // Search state
  const [searchForm, setSearchForm] = useState({
    postcode: '',
    radius: '1',
    council: '',
    status: '',
    keyword: '',
    applicant: '',
    agent: ''
  })
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'map', 'split'

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

        // Load user plan and saved searches
        await loadUserData(session.user.id)

      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadUserData = async (userId) => {
    try {
      // Load user plan
      const plan = await getUserPlan(userId)
      setUserPlan(plan)

      // Load saved searches
      const supabase = createBrowserClient()
      const { data: searches, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!error) {
        setSavedSearches(searches || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoadingPlan(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleManageSubscription = async () => {
    setManagingSubscription(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to access billing portal')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Unable to access billing portal. Please try again.')
    } finally {
      setManagingSubscription(false)
    }
  }

  const handleUpgrade = async (priceId, planName) => {
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Unable to start upgrade process. Please try again.')
    }
  }

  const deleteSavedSearch = async (searchId) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId)

      if (error) throw error

      // Remove from local state
      setSavedSearches(prev => prev.filter(s => s.id !== searchId))
    } catch (error) {
      console.error('Error deleting saved search:', error)
      alert('Failed to delete saved search')
    }
  }

  const saveCurrentSearch = async () => {
    if (!userPlan?.limits?.savedSearches || userPlan.limits.savedSearches === 0) {
      alert('Saved searches are not available on the free plan. Please upgrade to Pro or Premium.')
      return
    }

    if (userPlan.limits.savedSearches !== Infinity && savedSearches.length >= userPlan.limits.savedSearches) {
      alert(`You've reached your saved search limit of ${userPlan.limits.savedSearches}. Please delete some searches or upgrade to Premium for unlimited saved searches.`)
      return
    }

    const searchName = prompt('Enter a name for this search:')
    if (!searchName || searchName.trim() === '') return

    try {
      const supabase = createBrowserClient()

      // Create filters object
      const filters = {}
      if (searchForm.postcode) filters.postcode = searchForm.postcode
      if (searchForm.council) filters.council = searchForm.council
      if (searchForm.status) filters.status = searchForm.status
      if (searchForm.keyword) filters.keyword = searchForm.keyword
      if (searchForm.applicant) filters.applicant = searchForm.applicant
      if (searchForm.agent) filters.agent = searchForm.agent
      if (searchForm.radius) filters.radius = searchForm.radius

      const { data, error } = await supabase
        .from('saved_searches')
        .insert([
          {
            user_id: user.id,
            name: searchName.trim(),
            filters: filters
          }
        ])
        .select()

      if (error) throw error

      // Add to local state
      setSavedSearches(prev => [data[0], ...prev])
      alert('Search saved successfully!')

    } catch (error) {
      console.error('Error saving search:', error)
      alert('Failed to save search: ' + error.message)
    }
  }

  const runSavedSearch = (savedSearch) => {
    const filters = savedSearch.filters
    setSearchForm({
      postcode: filters.postcode || '',
      council: filters.council || '',
      status: filters.status || '',
      keyword: filters.keyword || '',
      applicant: filters.applicant || '',
      agent: filters.agent || '',
      radius: filters.radius || '1'
    })
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No session found')
      }

      // Build export URL with same parameters as search
      const params = new URLSearchParams()
      if (searchForm.postcode) params.append('postcode', searchForm.postcode)
      if (searchForm.council) params.append('council', searchForm.council)
      if (searchForm.status) params.append('status', searchForm.status)
      if (searchForm.keyword) params.append('keyword', searchForm.keyword)
      if (searchForm.applicant) params.append('applicant', searchForm.applicant)
      if (searchForm.agent) params.append('agent', searchForm.agent)

      const response = await fetch(`/api/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.upgrade_required) {
          alert('CSV export requires Premium plan. Please upgrade to access this feature.')
          return
        }
        throw new Error(data.error || 'Export failed')
      }

      // Download the CSV file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : 'planning-radar-export.csv'

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export CSV: ' + error.message)
    } finally {
      setExporting(false)
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
      if (searchForm.keyword) params.append('keyword', searchForm.keyword)
      if (searchForm.applicant) params.append('applicant', searchForm.applicant)
      if (searchForm.agent) params.append('agent', searchForm.agent)

      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers = {}
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/search?${params.toString()}`, {
        headers
      })
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

  if (loading || loadingPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const planInfo = getPlanDisplayInfo(userPlan?.plan || 'free')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-secondary tracking-tight">
                Planning Radar
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {userPlan && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${planInfo.color}-100 text-${planInfo.color}-800`}>
                  {planInfo.badge}
                </span>
              )}
              <span className="text-sm text-secondary-light">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-white text-secondary border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary tracking-tight">Dashboard</h1>
          <p className="mt-2 text-xl text-secondary-light">Search and track London planning applications</p>
        </div>

        {/* Subscription Status Card */}
        {userPlan && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-secondary mb-2">
                  {userPlan.plan === 'free' ? 'Free Plan' : `${planInfo.name} Plan`}
                </h2>

                {userPlan.plan === 'free' && (
                  <div className="space-y-2">
                    <p className="text-secondary-light">
                      You're currently on the free plan with limited access.
                    </p>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID, 'Pro')}
                        className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200"
                      >
                        Upgrade to Pro - £79/mo
                      </button>
                      <button
                        onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID, 'Premium')}
                        className="bg-accent text-white px-6 py-2 rounded-xl font-semibold hover:bg-accent-dark transition-all duration-200"
                      >
                        Upgrade to Premium - £299/mo
                      </button>
                    </div>
                  </div>
                )}

                {(userPlan.plan === 'pro' || userPlan.plan === 'premium') && (
                  <div className="space-y-2">
                    <p className="text-secondary-light">
                      {userPlan.current_period_end && `Next billing date: ${new Date(userPlan.current_period_end).toLocaleDateString()}`}
                    </p>
                    <button
                      onClick={handleManageSubscription}
                      disabled={managingSubscription}
                      className="bg-gray-100 text-secondary border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                      {managingSubscription ? 'Loading...' : 'Manage Subscription'}
                    </button>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-sm text-secondary-light">Plan Limits</div>
                <div className="text-secondary text-sm mt-1">
                  <div>Results: {userPlan.limits?.maxResults === Infinity ? 'Unlimited' : userPlan.limits?.maxResults}</div>
                  <div>History: {userPlan.limits?.historyDays === Infinity ? 'Unlimited' : `${userPlan.limits?.historyDays} days`}</div>
                  <div>Saved Searches: {userPlan.limits?.savedSearches === Infinity ? 'Unlimited' : userPlan.limits?.savedSearches}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Search */}
          <div className="lg:col-span-2 space-y-8">
            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-secondary mb-6">Search Planning Applications</h2>

              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      Search by Postcode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. E1 6AN"
                      value={searchForm.postcode}
                      onChange={(e) => handleFormChange('postcode', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      Search Radius
                    </label>
                    <select
                      value={searchForm.radius}
                      onChange={(e) => handleFormChange('radius', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    >
                      <option value="0.5">0.5 miles</option>
                      <option value="1">1 mile</option>
                      <option value="3">3 miles</option>
                      <option value="5">5 miles</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      Borough (Alternative to postcode)
                    </label>
                    <select
                      value={searchForm.council}
                      onChange={(e) => handleFormChange('council', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    >
                      <option value="">Select a borough...</option>
                      <option value="Camden">Camden</option>
                      <option value="Westminster">Westminster</option>
                      <option value="Hackney">Hackney</option>
                      <option value="Islington">Islington</option>
                      <option value="Tower Hamlets">Tower Hamlets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      Application Status
                    </label>
                    <select
                      value={searchForm.status}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    >
                      <option value="">All applications</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="refused">Refused</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Search Fields - Premium Features */}
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-semibold text-secondary">Advanced Search</h3>

                  {/* Keyword Search - Pro Feature */}
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      Keyword Search {!userPlan?.limits?.keywordSearch && <span className="text-accent text-xs">(Pro+)</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="Search in application descriptions..."
                      value={searchForm.keyword}
                      onChange={(e) => handleFormChange('keyword', e.target.value)}
                      disabled={!userPlan?.limits?.keywordSearch}
                      className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 ${
                        !userPlan?.limits?.keywordSearch ? 'bg-gray-50 text-gray-400' : ''
                      }`}
                    />
                    {!userPlan?.limits?.keywordSearch && (
                      <p className="text-xs text-accent mt-2">Upgrade to Pro to search by keywords</p>
                    )}
                  </div>

                  {/* Applicant and Agent Search - Premium Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-3">
                        Applicant Name {!userPlan?.limits?.applicantSearch && <span className="text-accent text-xs">(Premium)</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="Search by applicant name..."
                        value={searchForm.applicant}
                        onChange={(e) => handleFormChange('applicant', e.target.value)}
                        disabled={!userPlan?.limits?.applicantSearch}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 ${
                          !userPlan?.limits?.applicantSearch ? 'bg-gray-50 text-gray-400' : ''
                        }`}
                      />
                      {!userPlan?.limits?.applicantSearch && (
                        <p className="text-xs text-accent mt-2">Upgrade to Premium for applicant search</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-3">
                        Agent Name {!userPlan?.limits?.applicantSearch && <span className="text-accent text-xs">(Premium)</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="Search by agent name..."
                        value={searchForm.agent}
                        onChange={(e) => handleFormChange('agent', e.target.value)}
                        disabled={!userPlan?.limits?.applicantSearch}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 ${
                          !userPlan?.limits?.applicantSearch ? 'bg-gray-50 text-gray-400' : ''
                        }`}
                      />
                      {!userPlan?.limits?.applicantSearch && (
                        <p className="text-xs text-accent mt-2">Upgrade to Premium for agent search</p>
                      )}
                    </div>
                  </div>
                </div>

                {searchError && (
                  <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
                    <p className="text-danger text-sm">{searchError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search Applications'}
                </button>
              </form>
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-secondary">
                      Search Results ({searchResults.pagination?.total || 0})
                    </h2>

                    {/* View Mode Toggle */}
                    <div className="flex rounded-lg border border-slate-200 p-1">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          viewMode === 'list'
                            ? 'bg-primary text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📋 List
                      </button>
                      <button
                        onClick={() => setViewMode('map')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          viewMode === 'map'
                            ? 'bg-primary text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🗺️ Map
                      </button>
                      <button
                        onClick={() => setViewMode('split')}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          viewMode === 'split'
                            ? 'bg-primary text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📊 Split
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {searchResults.limits_applied && (
                      <span className="text-sm text-warning bg-warning/10 px-3 py-1 rounded-full border border-warning/20">
                        {userPlan.plan} plan: Limited results
                      </span>
                    )}
                    {searchResults.pagination?.total > 0 && (
                      <>
                        <button
                          onClick={saveCurrentSearch}
                          disabled={!userPlan?.limits?.savedSearches || userPlan.limits.savedSearches === 0}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            userPlan?.limits?.savedSearches && userPlan.limits.savedSearches > 0
                              ? 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!userPlan?.limits?.savedSearches || userPlan.limits.savedSearches === 0 ? 'Saved searches require Pro or Premium plan' : 'Save this search for later'}
                        >
                          💾 Save Search
                        </button>
                        <button
                          onClick={handleExportCSV}
                          disabled={exporting || !userPlan?.limits?.csvExport}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            userPlan?.limits?.csvExport
                              ? 'bg-accent text-white hover:bg-accent-dark shadow-sm hover:shadow-md'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!userPlan?.limits?.csvExport ? 'CSV export requires Premium plan' : 'Export search results to CSV'}
                        >
                          {exporting ? 'Exporting...' : '📊 Export CSV'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

{/* Conditional View Rendering */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {searchResults.applications?.map((app) => (
                      <div
                        key={app.id}
                        className="border border-slate-100 rounded-xl p-6 hover:border-slate-200 transition-colors duration-200 cursor-pointer"
                        onClick={() => setSelectedApplication(app)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 mr-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-secondary">
                                {app.description || app.title}
                              </h3>
                              <div className="flex items-center space-x-2 text-sm text-slate-500">
                                <span>Click for details</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-secondary-light mb-2">{app.address}</p>
                            {app.opportunity_score && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-500">Opportunity Score:</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  app.opportunity_score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                                  app.opportunity_score >= 50 ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {app.opportunity_score}/100
                                </span>
                              </div>
                            )}
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getStatusBackgroundColor(app.status) }}
                          >
                            {app.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-secondary-light border-t border-slate-100 pt-4">
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
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'map' && (
                  <div className="h-[600px]">
                    <MapView
                      applications={searchResults.applications || []}
                      onApplicationClick={setSelectedApplication}
                      showConstraints={userPlan?.limits?.fullDetail}
                      height="100%"
                    />
                  </div>
                )}

                {viewMode === 'split' && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left: List View */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {searchResults.applications?.map((app) => (
                        <div
                          key={app.id}
                          className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors duration-200 cursor-pointer"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-secondary text-sm pr-2">
                              {app.description || app.title}
                            </h4>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
                              style={{ backgroundColor: getStatusBackgroundColor(app.status) }}
                            >
                              {app.status}
                            </span>
                          </div>
                          <p className="text-secondary-light text-sm mb-2">{app.address}</p>
                          <div className="flex justify-between items-center text-xs text-secondary-light">
                            <span>{app.council}</span>
                            {app.opportunity_score && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                app.opportunity_score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                                app.opportunity_score >= 50 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {app.opportunity_score}/100
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right: Map View */}
                    <div className="h-[600px]">
                      <MapView
                        applications={searchResults.applications || []}
                        onApplicationClick={setSelectedApplication}
                        showConstraints={userPlan?.limits?.fullDetail}
                        height="100%"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Saved Searches */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-secondary">Saved Searches</h3>
                {userPlan?.limits?.savedSearches && (
                  <span className="text-sm text-secondary-light">
                    {savedSearches.length} / {userPlan.limits.savedSearches === Infinity ? '∞' : userPlan.limits.savedSearches}
                  </span>
                )}
              </div>

              {savedSearches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-secondary-light">No saved searches yet</p>
                  <p className="text-sm text-secondary-light mt-2">
                    Run a search and save it to track applications
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-secondary">{search.name}</h4>
                          <p className="text-sm text-secondary-light mt-1">
                            {new Date(search.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSavedSearch(search.id)}
                          className="text-danger hover:text-danger-dark text-sm"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Search parameters summary */}
                      <div className="text-xs text-secondary-light mb-3">
                        {Object.entries(search.filters).map(([key, value]) => (
                          value && (
                            <span key={key} className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 mb-1">
                              {key}: {value}
                            </span>
                          )
                        ))}
                      </div>

                      <button
                        onClick={() => runSavedSearch(search)}
                        className="w-full bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors duration-200"
                      >
                        🔄 Run Search
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary">Application Details</h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Application Info */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-secondary mb-4">Application Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Reference:</span>
                    <span className="ml-2 text-slate-600">{selectedApplication.reference}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Council:</span>
                    <span className="ml-2 text-slate-600">{selectedApplication.council}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Status:</span>
                    <span
                      className="ml-2 px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusBackgroundColor(selectedApplication.status) }}
                    >
                      {selectedApplication.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Date Validated:</span>
                    <span className="ml-2 text-slate-600">
                      {new Date(selectedApplication.date_validated).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Application Type:</span>
                    <span className="ml-2 text-slate-600">
                      {selectedApplication.development_type || selectedApplication.type || 'Planning Application'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Applicant:</span>
                    <span className="ml-2 text-slate-600">
                      {selectedApplication.applicant || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="font-medium text-slate-700">Description:</span>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    {selectedApplication.description || selectedApplication.title}
                  </p>
                </div>

                <div className="mt-4">
                  <span className="font-medium text-slate-700">Address:</span>
                  <p className="mt-1 text-slate-600">{selectedApplication.address}</p>
                </div>

                {selectedApplication.external_link && (
                  <div className="mt-4">
                    <a
                      href={selectedApplication.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      View on Council Portal
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Property Intelligence Panel */}
              {userPlan?.limits?.fullDetail ? (
                <EnrichmentPanel applicationReference={selectedApplication.reference} />
              ) : (
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-primary">Property Intelligence</h3>
                    <span className="px-2 py-1 bg-accent text-white text-xs rounded-full font-medium">
                      Pro Feature
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Unlock detailed property analysis including opportunity scores, price intelligence,
                    planning constraints, and risk assessments.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID, 'Pro')}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                    >
                      Upgrade to Pro - £79/mo
                    </button>
                    <button
                      onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID, 'Premium')}
                      className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors text-sm font-medium"
                    >
                      Premium - £299/mo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}