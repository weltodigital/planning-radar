import { useState, useEffect } from 'react'
import Link from 'next/link'

// Mock user data - in production this would come from authentication
const mockUser = {
  email: 'demo@example.com',
  plan: 'free_trial',
  trialEndsAt: '2026-03-03'
}

export default function Dashboard() {
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    postcode: '',
    radius: '1',
    council: '',
    keyword: '',
    status: ''
  })
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (response.status === 403) {
        setShowUpgrade(true)
        setUpgradeMessage(data.error)
        return
      }

      if (data.applications) {
        setSearchResults(data.applications)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSearch = async () => {
    if (mockUser.plan === 'free_trial') {
      setShowUpgrade(true)
      setUpgradeMessage('Saved searches require Pro or Premium plan')
      return
    }

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Search ${new Date().toLocaleDateString()}`,
          filters
        })
      })

      if (response.status === 403) {
        const data = await response.json()
        setShowUpgrade(true)
        setUpgradeMessage(data.error)
      }
    } catch (error) {
      console.error('Save search error:', error)
    }
  }

  const handleExportCSV = async () => {
    if (mockUser.plan !== 'premium') {
      setShowUpgrade(true)
      setUpgradeMessage('CSV export requires Premium plan')
      return
    }

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      window.open(`/api/export/csv?${params}`, '_blank')
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-success/10 text-success'
      case 'refused': return 'bg-danger/10 text-danger'
      case 'pending': return 'bg-warning/10 text-warning'
      default: return 'bg-muted/10 text-muted'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-secondary">
                Planning Radar
              </Link>
              <div className="hidden sm:flex space-x-6">
                <Link href="/dashboard" className="text-primary font-medium">
                  Dashboard
                </Link>
                <Link href="/dashboard/saved-searches" className="text-secondary-light hover:text-secondary">
                  Saved Searches
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(mockUser.plan)}`}>
                {mockUser.plan === 'free_trial' ? 'Free Trial' : mockUser.plan.charAt(0).toUpperCase() + mockUser.plan.slice(1)}
              </span>
              <span className="hidden sm:block text-sm text-secondary-light">{mockUser.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Trial Banner */}
      {mockUser.plan === 'free_trial' && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-primary text-sm">
                  <strong>Free Trial Active</strong> - Trial ends {mockUser.trialEndsAt}. Limited to 10 results per search.
                </div>
              </div>
              <Link href="/pricing" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-dark transition-all duration-200 shadow-sm">
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Search Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold text-secondary mb-6">Search Planning Applications</h2>

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Postcode & Radius */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Postcode & Radius
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. SW1A 1AA"
                      value={filters.postcode}
                      onChange={(e) => setFilters(prev => ({ ...prev, postcode: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    />
                    <select
                      value={filters.radius}
                      onChange={(e) => setFilters(prev => ({ ...prev, radius: e.target.value }))}
                      className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    >
                      <option value="0.5">0.5mi</option>
                      <option value="1">1mi</option>
                      <option value="3">3mi</option>
                      <option value="5">5mi</option>
                    </select>
                  </div>
                </div>

                {/* Council */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Council (Alternative to postcode)
                  </label>
                  <select
                    value={filters.council}
                    onChange={(e) => setFilters(prev => ({ ...prev, council: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                  >
                    <option value="">Select Council...</option>
                    <option value="Bristol">Bristol City Council</option>
                    <option value="Birmingham">Birmingham City Council</option>
                    <option value="Manchester">Manchester City Council</option>
                    <option value="Leeds">Leeds City Council</option>
                  </select>
                </div>

                {/* Keywords - Pro Feature */}
                <div className="relative">
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Keywords {mockUser.plan === 'free_trial' && (
                      <span className="text-primary text-xs font-normal">(Pro+)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder={mockUser.plan === 'free_trial' ? 'Upgrade for keyword search' : 'e.g. extension, new build'}
                    value={filters.keyword}
                    onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                    disabled={mockUser.plan === 'free_trial'}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 ${
                      mockUser.plan === 'free_trial' ? 'bg-gray-50 text-gray-400' : ''
                    }`}
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
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Refused">Refused</option>
                  </select>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Searching...' : 'Search Applications'}
                </button>
              </form>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleSaveSearch}
                  className="w-full bg-slate-50 text-secondary px-6 py-3 rounded-xl font-medium hover:bg-slate-100 transition-all duration-200"
                >
                  💾 Save Search {mockUser.plan === 'free_trial' && '(Pro+)'}
                </button>

                <button
                  onClick={handleExportCSV}
                  className="w-full bg-slate-50 text-secondary px-6 py-3 rounded-xl font-medium hover:bg-slate-100 transition-all duration-200"
                >
                  📊 Export CSV {mockUser.plan !== 'premium' && '(Premium)'}
                </button>

                {mockUser.plan !== 'premium' && (
                  <Link
                    href="/dashboard/search/applicant"
                    className="block w-full bg-slate-50 text-secondary px-6 py-3 rounded-xl font-medium hover:bg-slate-100 text-center transition-all duration-200">
                  >
                    🔍 Search Applicants/Agents (Premium)
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg">
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-secondary">
                  Search Results ({searchResults.length})
                </h3>
                {mockUser.plan === 'free_trial' && searchResults.length === 10 && (
                  <p className="text-sm text-warning mt-1">
                    ⚠️ Showing limited results. <Link href="/pricing" className="text-primary hover:underline">Upgrade</Link> for unlimited access.
                  </p>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-secondary-light mt-2">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-secondary-light">
                    <p>No applications found. Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  searchResults.map((app) => (
                    <div key={app.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-secondary flex-1 mr-4">
                          {app.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      <p className="text-secondary-light mb-2">{app.address}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-secondary-light">
                        <span><strong>Council:</strong> {app.council}</span>
                        <span><strong>Date:</strong> {new Date(app.date_validated).toLocaleDateString()}</span>
                        {app.applicant && <span><strong>Applicant:</strong> {app.applicant}</span>}
                        {app.type && <span><strong>Type:</strong> {app.type}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary mb-4">Upgrade Required</h3>
            <p className="text-secondary-light mb-6">{upgradeMessage}</p>
            <div className="flex space-x-3">
              <Link
                href="/pricing"
                className="flex-1 bg-accent text-white px-6 py-3 rounded-xl text-center font-semibold hover:bg-accent-dark transition-all duration-200 shadow-lg"
              >
                View Pricing
              </Link>
              <button
                onClick={() => setShowUpgrade(false)}
                className="flex-1 bg-slate-50 text-secondary px-6 py-3 rounded-xl font-medium hover:bg-slate-100 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}