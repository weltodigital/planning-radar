import { useState, useEffect } from 'react'
import Link from 'next/link'

// Get councils for dropdown at build time
export async function getStaticProps() {
  // Return empty props - we'll fetch data client-side using the search API
  return {
    props: {
      councils: [
        { lpa_name: 'Camden' },
        { lpa_name: 'Westminster' },
        { lpa_name: 'Southwark' },
        { lpa_name: 'Lambeth' },
        { lpa_name: 'Islington' },
        { lpa_name: 'Hackney' },
        { lpa_name: 'Tower Hamlets' },
        { lpa_name: 'Greenwich' },
        { lpa_name: 'Kensington and Chelsea' },
        { lpa_name: 'Hammersmith and Fulham' }
      ]
    },
    revalidate: 86400 // Revalidate daily
  }
}

function getStatusBadgeColor(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'refused':
      return 'bg-red-100 text-red-800'
    case 'pending':
    case 'application received':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function Demo({ councils }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    council: '',
    keyword: '',
    status: ''
  })
  const [showUpgrade, setShowUpgrade] = useState(false)

  const fetchApplications = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()

      // Apply filters
      if (filters.council) params.append('council', filters.council)
      if (filters.keyword) params.append('keyword', filters.keyword)
      if (filters.status) params.append('status', filters.status)

      // Always limit to 10 for demo
      params.append('limit', '10')

      const response = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          'X-Demo-Mode': 'true'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications')
      }

      setApplications(data.applications || [])

      // Show upgrade prompt if there are more results available
      if (data.pagination.total > 10) {
        setShowUpgrade(true)
      } else {
        setShowUpgrade(false)
      }

    } catch (err) {
      console.error('Search error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load initial data on component mount
  useEffect(() => {
    fetchApplications()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchApplications()
  }, [filters])

  return (
    <>
      <head>
        <title>Live Demo - Planning Radar | Try Our Planning Application Search</title>
        <meta
          name="description"
          content="Try our live demo to search London planning applications by postcode, borough, or keyword. See how Planning Radar helps you find development opportunities."
        />
      </head>

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
              <div className="flex space-x-4">
                <Link href="/pricing" className="text-secondary-light hover:text-secondary px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Pricing
                </Link>
                <Link href="/login" className="bg-white text-secondary border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 mr-2">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-all duration-200 shadow-sm">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-primary">🔍 Live Demo</h2>
              <p className="text-secondary-light">
                Try our planning application search with real data. Limited to 10 results -
                <Link href="/signup" className="text-primary hover:underline font-medium ml-1">
                  sign up for unlimited access
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Search Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl font-bold text-secondary mb-6">Search Planning Applications</h2>

                <div className="space-y-4">
                  {/* Borough Filter */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Borough
                    </label>
                    <select
                      value={filters.council}
                      onChange={(e) => setFilters(prev => ({ ...prev, council: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    >
                      <option value="">All Boroughs</option>
                      {councils.slice(0, 10).map(council => (
                        <option key={council.lpa_name} value={council.lpa_name}>
                          {council.lpa_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Keywords
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. extension, new build, conservatory"
                      value={filters.keyword}
                      onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="refused">Refused</option>
                    </select>
                  </div>

                  {/* Demo Note */}
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-6">
                    <h4 className="font-medium text-accent mb-2">✨ Demo Features</h4>
                    <ul className="text-sm text-secondary-light space-y-1">
                      <li>• Real planning application data</li>
                      <li>• Live search and filtering</li>
                      <li>• Limited to 10 results</li>
                      <li>• <Link href="/signup" className="text-primary hover:underline">Sign up</Link> for unlimited access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg">
                <div className="p-8 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-secondary">
                    {loading ? 'Loading...' : `Demo Results (${applications.length})`}
                  </h3>
                  <p className="text-sm text-secondary-light mt-1">
                    {loading ? 'Fetching live planning application data...' : 'Real planning data from London boroughs'}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-8">
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center">
                      <div className="text-red-600 mb-2">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">Error loading applications</p>
                      </div>
                      <p className="text-sm text-gray-600">{error}</p>
                      <button
                        onClick={fetchApplications}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="p-8 text-center text-secondary-light">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.005-5.707-2.707l1.414-1.414C8.586 11.758 10.169 12.5 12 12.5s3.414-.742 4.293-1.621L17.707 12.293A7.962 7.962 0 0112 15z" />
                      </svg>
                      <p className="font-medium">No applications found</p>
                      <p className="text-sm mt-1">Try adjusting your search filters</p>
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-medium text-secondary flex-1 mr-4 leading-tight">
                            {app.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(app.status)}`}>
                            {app.status || 'Pending'}
                          </span>
                        </div>

                        {app.address && (
                          <p className="text-secondary-light mb-3">{app.address}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-secondary-light">
                          <div>
                            <span className="font-medium">Council:</span> {app.council}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(app.date_validated).toLocaleDateString()}
                          </div>
                          {app.type && (
                            <div>
                              <span className="font-medium">Type:</span> {app.type}
                            </div>
                          )}
                          {app.applicant && (
                            <div>
                              <span className="font-medium">Applicant:</span> {app.applicant}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Upgrade prompt if more results available */}
                {showUpgrade && (
                  <div className="px-6 py-8 bg-gradient-to-r from-primary/5 to-accent/5 border-t border-slate-100 text-center">
                    <p className="text-secondary mb-4">
                      <strong>More results available!</strong> This demo is limited to 10 results.
                    </p>
                    <Link
                      href="/signup"
                      className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Get Unlimited Results →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary mb-4">Ready for Full Access?</h2>
              <p className="text-xl text-secondary-light">Compare what's available in our paid plans</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-center">Demo (Current)</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>10 results per search</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>Basic filters</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-muted mr-2">✗</span>
                    <span>No saved searches</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-muted mr-2">✗</span>
                    <span>No CSV export</span>
                  </li>
                </ul>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">FREE</div>
                  <div className="text-sm text-muted">Demo only</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-accent p-8 shadow-xl relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Pro</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>Unlimited results</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>All filters</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>5 saved searches</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-muted mr-2">✗</span>
                    <span>No CSV export</span>
                  </li>
                </ul>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">£79</div>
                  <div className="text-sm text-muted">per month</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-center">Premium</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>Unlimited saved searches</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>CSV export</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-success mr-2">✓</span>
                    <span>Applicant search</span>
                  </li>
                </ul>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">£299</div>
                  <div className="text-sm text-muted">per month</div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl text-lg mr-4"
              >
                Start Free Trial →
              </Link>
              <Link
                href="/pricing"
                className="text-primary hover:text-primary-dark font-medium text-lg transition-colors duration-200"
              >
                View Full Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/60 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-muted">&copy; 2024 Planning Radar. All rights reserved.</p>
              <p className="text-muted text-sm mt-2">Powered by GLA Planning London Datahub</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}