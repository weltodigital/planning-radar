import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createServiceClient } from '../lib/supabase/pages-client'

export async function getStaticProps() {
  try {
    const supabase = createServiceClient()

    // Get sample applications for demo (limit to 50 for performance)
    const { data: sampleApplications, error } = await supabase
      .from('planning_applications')
      .select('id, title, address, lpa_name, date_validated, decision, application_type')
      .order('date_validated', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching sample applications:', error)
    }

    // Get unique councils for dropdown
    const { data: councils } = await supabase
      .from('planning_applications')
      .select('lpa_name')
      .group('lpa_name')
      .order('lpa_name')
      .limit(20) // Limit for demo

    return {
      props: {
        sampleApplications: sampleApplications || [],
        councils: councils || []
      },
      revalidate: 3600 // Revalidate every hour
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return {
      props: {
        sampleApplications: [],
        councils: []
      },
      revalidate: 3600
    }
  }
}

function getStatusBadgeColor(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-success/10 text-success'
    case 'refused':
      return 'bg-danger/10 text-danger'
    case 'pending':
      return 'bg-warning/10 text-warning'
    default:
      return 'bg-muted/10 text-muted'
  }
}

export default function Demo({ sampleApplications, councils }) {
  const [filteredApplications, setFilteredApplications] = useState(sampleApplications.slice(0, 10))
  const [filters, setFilters] = useState({
    council: '',
    keyword: '',
    status: ''
  })
  const [showUpgrade, setShowUpgrade] = useState(false)

  const handleSearch = () => {
    let filtered = [...sampleApplications]

    // Apply filters
    if (filters.council) {
      filtered = filtered.filter(app =>
        app.lpa_name?.toLowerCase().includes(filters.council.toLowerCase())
      )
    }

    if (filters.keyword) {
      filtered = filtered.filter(app =>
        app.title?.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        app.address?.toLowerCase().includes(filters.keyword.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter(app =>
        app.decision?.toLowerCase() === filters.status.toLowerCase()
      )
    }

    // Limit to 10 for demo (simulating free trial)
    setFilteredApplications(filtered.slice(0, 10))

    // Show upgrade prompt if more results available
    if (filtered.length > 10) {
      setShowUpgrade(true)
    }
  }

  useEffect(() => {
    handleSearch()
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
                    Demo Results ({filteredApplications.length})
                  </h3>
                  <p className="text-sm text-secondary-light mt-1">
                    Showing sample data from our planning application database
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <div className="p-8 text-center text-secondary-light">
                      <p>No applications found matching your criteria.</p>
                      <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
                    </div>
                  ) : (
                    filteredApplications.map((app) => (
                      <div key={app.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-medium text-secondary flex-1 mr-4">
                            {app.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.decision)}`}>
                            {app.decision || 'Pending'}
                          </span>
                        </div>

                        <p className="text-secondary-light mb-2">{app.address}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-secondary-light">
                          <span><strong>Council:</strong> {app.lpa_name}</span>
                          <span><strong>Date:</strong> {new Date(app.date_validated).toLocaleDateString()}</span>
                          {app.application_type && <span><strong>Type:</strong> {app.application_type}</span>}
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