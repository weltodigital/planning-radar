import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { createBrowserClient } from '../../lib/supabase/pages-client'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
          <p className="mt-2 text-gray-600">Search and track UK planning applications</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Planning Applications</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Postcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. SW1A 1AA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                  Council (Alternative to postcode)
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All applications</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="refused">Refused</option>
                </select>
              </div>
            </div>

            <button className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
              Search Applications
            </button>
          </div>
        </div>

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