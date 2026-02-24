import { useState } from 'react'
import Link from 'next/link'

// Mock user data
const mockUser = {
  email: 'demo@example.com',
  plan: 'free_trial', // Show upgrade prompt for non-premium users
  trialEndsAt: '2026-03-03'
}

// Mock search results for premium demo
const mockResults = [
  {
    id: '1',
    title: 'Single storey rear extension',
    address: '45 Oak Road, Bristol BS4 2PL',
    council: 'Bristol City Council',
    status: 'Approved',
    date_validated: '2026-02-15',
    applicant: 'Bristol Property Developers Ltd',
    agent: 'Smith Planning Associates',
    type: 'Householder'
  },
  {
    id: '2',
    title: 'Change of use from office to residential',
    address: '128 Commercial Street, Birmingham B1 1RF',
    council: 'Birmingham City Council',
    status: 'Pending',
    date_validated: '2026-02-20',
    applicant: 'Bristol Property Developers Ltd',
    agent: 'Urban Planning Solutions',
    type: 'Change of Use'
  }
]

export default function ApplicantSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('both')
  const [filters, setFilters] = useState({
    council: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'refused': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    if (mockUser.plan !== 'premium') {
      setShowUpgrade(true)
      return
    }

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setResults(mockResults)
      setLoading(false)
    }, 1000)
  }

  if (mockUser.plan !== 'premium') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  Planning Radar
                </Link>
                <div className="flex space-x-6">
                  <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/search/applicant" className="text-blue-600 font-medium">
                    Applicant Search
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(mockUser.plan)}`}>
                  {mockUser.plan === 'free_trial' ? 'Free Trial' : mockUser.plan.charAt(0).toUpperCase() + mockUser.plan.slice(1)}
                </span>
                <span className="text-sm text-gray-600">{mockUser.email}</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-purple-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Applicant & Agent Search
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Track competitors, find development opportunities, and monitor planning activity by searching for specific applicants and agents.
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">
                🔒 Premium Feature
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold text-gray-900 mb-2">🏗️ Track Competitors</h3>
                  <p className="text-sm text-gray-600">
                    Monitor applications from specific developers and property companies to stay ahead of the competition.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold text-gray-900 mb-2">🎯 Find Opportunities</h3>
                  <p className="text-sm text-gray-600">
                    Identify successful applicants and agents to discover new business relationships and market trends.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold text-gray-900 mb-2">📊 Market Intelligence</h3>
                  <p className="text-sm text-gray-600">
                    Analyze approval rates and application patterns for different developers and planning consultants.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold text-gray-900 mb-2">🔍 Advanced Filtering</h3>
                  <p className="text-sm text-gray-600">
                    Search by applicant name, agent name, council area, application status, and date ranges.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Searches</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium w-32">Applicant:</span>
                    <span>"Barratt Homes", "Taylor Wimpey", "Persimmon Homes"</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Agent:</span>
                    <span>"Pegasus Group", "Turley", "DPP Planning"</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Combined:</span>
                    <span>Search both applicants and agents simultaneously</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pricing"
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700"
                >
                  Upgrade to Premium - £199/mo
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Why Upgrade to Premium?
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-purple-600">Applicant Search</h4>
                  <p className="text-gray-600">Track specific developers and companies</p>
                </div>
                <div>
                  <h4 className="font-medium text-purple-600">CSV Export</h4>
                  <p className="text-gray-600">Download up to 10,000 records</p>
                </div>
                <div>
                  <h4 className="font-medium text-purple-600">Unlimited Searches</h4>
                  <p className="text-gray-600">No limits on saved searches</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Premium user interface (this would show if user has premium plan)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Planning Radar
              </Link>
              <div className="flex space-x-6">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
                <Link href="/dashboard/search/applicant" className="text-purple-600 font-medium">
                  Applicant Search
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Premium
              </span>
              <span className="text-sm text-gray-600">{mockUser.email}</span>
            </div>
          </div>
        </div>
      </nav>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Search Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  🔍 Search Applicants & Agents
                </h2>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Query
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Barratt Homes, Pegasus Group"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Type
                    </label>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="both">Both Applicants & Agents</option>
                      <option value="applicant">Applicants Only</option>
                      <option value="agent">Agents Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Council
                    </label>
                    <select
                      value={filters.council}
                      onChange={(e) => setFilters(prev => ({ ...prev, council: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Councils</option>
                      <option value="Bristol">Bristol City Council</option>
                      <option value="Birmingham">Birmingham City Council</option>
                      <option value="Manchester">Manchester City Council</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Refused">Refused</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results ({results.length})
                  </h3>
                </div>

                <div className="divide-y">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Searching...</p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>Enter a search query to find planning applications by applicant or agent.</p>
                    </div>
                  ) : (
                    results.map((app) => (
                      <div key={app.id} className="p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-medium text-gray-900 flex-1 mr-4">
                            {app.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                            {app.status}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">{app.address}</p>

                        <div className="bg-purple-50 rounded p-3 mb-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-purple-900">Applicant:</span>
                              <span className="text-purple-700 ml-1">{app.applicant}</span>
                            </div>
                            <div>
                              <span className="font-medium text-purple-900">Agent:</span>
                              <span className="text-purple-700 ml-1">{app.agent}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span><strong>Council:</strong> {app.council}</span>
                          <span><strong>Date:</strong> {new Date(app.date_validated).toLocaleDateString()}</span>
                          <span><strong>Type:</strong> {app.type}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}