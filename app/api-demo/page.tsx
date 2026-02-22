/**
 * API Demo Page - Shows all Planning Radar API endpoints in action
 */

'use client'

import { useState } from 'react'

interface APIResult {
  endpoint: string
  loading: boolean
  data: any
  error: string | null
}

export default function APIDemoPage() {
  const [results, setResults] = useState<Record<string, APIResult>>({})

  const callAPI = async (endpoint: string, description: string) => {
    setResults(prev => ({
      ...prev,
      [endpoint]: { endpoint, loading: true, data: null, error: null }
    }))

    try {
      const response = await fetch(endpoint)
      const data = await response.json()

      setResults(prev => ({
        ...prev,
        [endpoint]: { endpoint, loading: false, data, error: null }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          loading: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  const apiEndpoints = [
    {
      endpoint: '/api/lpas?limit=5',
      description: 'Top 5 Local Planning Authorities',
      category: 'Core Data'
    },
    {
      endpoint: '/api/search/counts?council=bristol&days_back=7',
      description: 'Bristol Applications (Last 7 Days)',
      category: 'Live Counts'
    },
    {
      endpoint: '/api/search/counts?council=cambridge&days_back=30',
      description: 'Cambridge Applications (Last 30 Days)',
      category: 'Live Counts'
    },
    {
      endpoint: '/api/dashboard/activity?period=7&top=5',
      description: 'Activity Dashboard (Top 5, Last 7 Days)',
      category: 'Analytics'
    },
    {
      endpoint: '/api/search?council=bristol',
      description: 'Search Database (Bristol)',
      category: 'Database Search'
    },
    {
      endpoint: '/api/test/database',
      description: 'Database Status',
      category: 'System'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Planning Radar API Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Real-time UK planning application data using free Planning API calls.
            Click any endpoint to see live results.
          </p>

          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">✨ What's Working:</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• <strong>268 UK councils</strong> available via Planning API</li>
              <li>• <strong>Live application counts</strong> for any council and date range</li>
              <li>• <strong>Activity trends</strong> showing busiest areas</li>
              <li>• <strong>Free API calls</strong> - no credits needed for counts</li>
              <li>• <strong>Full postcode geocoding</strong> via postcodes.io</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6">
          {['Core Data', 'Live Counts', 'Analytics', 'Database Search', 'System'].map(category => {
            const categoryEndpoints = apiEndpoints.filter(e => e.category === category)

            return (
              <div key={category} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {category}
                </h2>

                <div className="space-y-4">
                  {categoryEndpoints.map(({ endpoint, description }) => (
                    <div key={endpoint} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{description}</h3>
                          <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {endpoint}
                          </code>
                        </div>
                        <button
                          onClick={() => callAPI(endpoint, description)}
                          disabled={results[endpoint]?.loading}
                          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {results[endpoint]?.loading ? 'Loading...' : 'Test API'}
                        </button>
                      </div>

                      {results[endpoint] && (
                        <div className="mt-3">
                          {results[endpoint].error ? (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-red-800 text-sm">
                                <strong>Error:</strong> {results[endpoint].error}
                              </p>
                            </div>
                          ) : results[endpoint].data ? (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="mb-2">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  results[endpoint].data.success
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {results[endpoint].data.success ? 'SUCCESS' : 'ERROR'}
                                </span>
                                {results[endpoint].data.message && (
                                  <span className="ml-2 text-sm text-gray-600">
                                    {results[endpoint].data.message}
                                  </span>
                                )}
                              </div>
                              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(results[endpoint].data, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Ready for Production</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">MVP Features Available:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Council-based planning activity tracking</li>
                <li>• Date range filtering and trends</li>
                <li>• Activity dashboards and analytics</li>
                <li>• Postcode geocoding for radius search</li>
                <li>• Real-time application counting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Next Phase (When Credits Available):</h3>
              <ul className="space-y-1 text-sm">
                <li>• Full application details and descriptions</li>
                <li>• Applicant and agent information</li>
                <li>• Decision status and dates</li>
                <li>• Complete search and filtering</li>
                <li>• User dashboards and saved searches</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}