import { useState, useEffect } from 'react'
import Link from 'next/link'

// Mock user data - in production this would come from authentication
const mockUser = {
  email: 'demo@example.com',
  plan: 'pro', // Changed to pro to show saved searches features
  trialEndsAt: '2026-03-03'
}

// Mock saved searches data
const mockSavedSearches = [
  {
    id: '1',
    name: 'Bristol Extensions',
    filters: { council: 'Bristol', keyword: 'extension' },
    created_at: '2026-02-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'Birmingham New Builds',
    filters: { council: 'Birmingham', keyword: 'new build', status: 'Approved' },
    created_at: '2026-02-19T15:30:00Z'
  },
  {
    id: '3',
    name: 'SW1A Applications',
    filters: { postcode: 'SW1A 1AA', radius: '2' },
    created_at: '2026-02-18T09:15:00Z'
  }
]

export default function SavedSearches() {
  const [savedSearches, setSavedSearches] = useState(mockSavedSearches)
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFilters = (filters) => {
    const parts = []
    if (filters.postcode) {
      parts.push(`📍 ${filters.postcode}`)
      if (filters.radius) parts.push(`${filters.radius}mi radius`)
    }
    if (filters.council) parts.push(`🏛️ ${filters.council}`)
    if (filters.keyword) parts.push(`🔍 "${filters.keyword}"`)
    if (filters.status) parts.push(`📊 ${filters.status}`)
    return parts.join(' • ')
  }

  const runSavedSearch = (filters) => {
    // Navigate to dashboard with filters
    const params = new URLSearchParams(filters).toString()
    window.location.href = `/dashboard?${params}`
  }

  const deleteSavedSearch = async (id) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      setSavedSearches(prev => prev.filter(search => search.id !== id))
    }
  }

  const getSearchLimit = () => {
    if (mockUser.plan === 'premium') return 'Unlimited'
    if (mockUser.plan === 'pro') return '5'
    return '0'
  }

  if (mockUser.plan === 'free_trial') {
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
                  <Link href="/dashboard/saved-searches" className="text-blue-600 font-medium">
                    Saved Searches
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(mockUser.plan)}`}>
                  Free Trial
                </span>
                <span className="text-sm text-gray-600">{mockUser.email}</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Saved Searches</h2>
            <p className="mt-1 text-sm text-gray-500">Save your frequent searches for quick access</p>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Upgrade to Pro or Premium
              </h3>
              <p className="text-blue-700 mb-4">
                Saved searches are available with Pro and Premium plans. Never lose track of your important searches again.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded border p-4">
                  <h4 className="font-medium text-gray-900">Pro Plan - £49/mo</h4>
                  <p className="text-sm text-gray-600 mt-1">Up to 5 saved searches</p>
                </div>
                <div className="bg-white rounded border p-4">
                  <h4 className="font-medium text-gray-900">Premium Plan - £199/mo</h4>
                  <p className="text-sm text-gray-600 mt-1">Unlimited saved searches</p>
                </div>
              </div>
              <Link href="/pricing" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                View Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                <Link href="/dashboard/saved-searches" className="text-blue-600 font-medium">
                  Saved Searches
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(mockUser.plan)}`}>
                {mockUser.plan.charAt(0).toUpperCase() + mockUser.plan.slice(1)}
              </span>
              <span className="text-sm text-gray-600">{mockUser.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-gray-600 mt-1">
              {savedSearches.length} of {getSearchLimit()} searches saved
            </p>
          </div>
          <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
            + New Search
          </Link>
        </div>

        {/* Plan Limit Warning */}
        {mockUser.plan === 'pro' && savedSearches.length >= 4 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-yellow-600 text-sm">
                <strong>Almost at your limit!</strong> You have {5 - savedSearches.length} search slots remaining.
                <Link href="/pricing" className="text-blue-600 hover:underline ml-1">
                  Upgrade to Premium
                </Link> for unlimited saved searches.
              </div>
            </div>
          </div>
        )}

        {/* Saved Searches List */}
        <div className="bg-white rounded-lg border">
          {savedSearches.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches yet</h3>
              <p className="text-gray-500 mb-4">Save your frequent searches for quick access later.</p>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
                Create your first search →
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {savedSearches.map((search) => (
                <div key={search.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {search.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {formatFilters(search.filters)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created {new Date(search.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => runSavedSearch(search.filters)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
                      >
                        Run Search
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(search.id)}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Search Limits by Plan</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`bg-white rounded border p-4 ${mockUser.plan === 'free_trial' ? 'ring-2 ring-gray-300' : ''}`}>
              <h4 className="font-medium text-gray-900">Free Trial</h4>
              <p className="text-2xl font-bold text-gray-600 my-2">0</p>
              <p className="text-sm text-gray-500">No saved searches</p>
            </div>
            <div className={`bg-white rounded border p-4 ${mockUser.plan === 'pro' ? 'ring-2 ring-blue-500' : ''}`}>
              <h4 className="font-medium text-gray-900">Pro - £49/mo</h4>
              <p className="text-2xl font-bold text-blue-600 my-2">5</p>
              <p className="text-sm text-gray-500">Saved searches</p>
            </div>
            <div className={`bg-white rounded border p-4 ${mockUser.plan === 'premium' ? 'ring-2 ring-purple-500' : ''}`}>
              <h4 className="font-medium text-gray-900">Premium - £199/mo</h4>
              <p className="text-2xl font-bold text-purple-600 my-2">∞</p>
              <p className="text-sm text-gray-500">Unlimited saves</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}