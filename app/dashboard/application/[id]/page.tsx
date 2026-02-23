'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlanningApplication } from '@/lib/types'
import { getPlanLimits } from '@/lib/plans'

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [application, setApplication] = useState<PlanningApplication | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free_trial')
  const [planLimits, setPlanLimits] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadApplicationDetails()
  }, [params.id])

  const loadApplicationDetails = async () => {
    try {
      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get user plan
      const plan = await getUserPlan(user.id)
      setUserPlan(plan)
      setPlanLimits(getPlanLimits(plan))

      // Fetch application details
      const { data: app, error: appError } = await (supabase
        .from('planning_applications') as any)
        .select('*')
        .eq('id', params.id)
        .single()

      if (appError || !app) {
        setError('Application not found')
        setLoading(false)
        return
      }

      setApplication(app)
    } catch (err) {
      console.error('Error loading application:', err)
      setError('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (decision?: string) => {
    if (!decision) return 'bg-gray-100 text-gray-800'
    const d = decision.toLowerCase()
    if (d.includes('approved') || d.includes('granted')) return 'bg-green-100 text-green-800'
    if (d.includes('refused') || d.includes('rejected')) return 'bg-red-100 text-red-800'
    if (d.includes('pending') || d.includes('awaiting')) return 'bg-yellow-100 text-yellow-800'
    if (d.includes('withdrawn')) return 'bg-gray-100 text-gray-800'
    return 'bg-blue-100 text-blue-800'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const canViewFullDetails = planLimits?.fullDetail

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Navigation */}
        <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">PR</span>
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Planning Radar</h1>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested planning application could not be found.'}</p>
            <Link
              href="/dashboard/search"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">PR</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Planning Radar</h1>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Dashboard
              </Link>
              <Link href="/dashboard/search" className="text-blue-600 font-semibold transition-all duration-200">
                Search
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500 font-medium capitalize">
                    {userPlan.replace('_', ' ')}
                  </div>
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
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex space-x-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <span>›</span>
            <Link href="/dashboard/search" className="hover:text-blue-600 transition-colors">Search</Link>
            <span>›</span>
            <span className="text-gray-900">Application Details</span>
          </nav>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 pr-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {application.title || 'Planning Application'}
                  </h1>
                  {application.address && (
                    <div className="flex items-start mb-2">
                      <svg className="w-5 h-5 mr-3 mt-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="text-gray-700 text-lg">{application.address}</p>
                    </div>
                  )}
                  {application.postcode && (
                    <div className="flex items-center mb-4">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-700 font-mono">{application.postcode}</p>
                    </div>
                  )}
                </div>
                {application.decision && (
                  <div className="flex-shrink-0">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(application.decision)}`}>
                      {application.decision}
                    </span>
                  </div>
                )}
              </div>

              {/* Key Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Council</h3>
                    <p className="text-gray-900 font-medium">{application.lpa_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Application ID</h3>
                    <p className="text-gray-900 font-mono text-sm">{application.external_id || 'Unknown'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Date Validated</h3>
                    <p className="text-gray-900">{formatDate(application.date_validated)}</p>
                  </div>
                  {application.application_type && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Application Type</h3>
                      <p className="text-gray-900 capitalize">{application.application_type}</p>
                    </div>
                  )}
                </div>
              </div>

              {application.external_link && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <a
                    href={application.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Council Website
                  </a>
                </div>
              )}
            </div>

            {/* Timeline Card */}
            {(application.date_received || application.date_validated || application.date_decision) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Application Timeline</h2>
                <div className="space-y-4">
                  {application.date_received && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Application Received</p>
                        <p className="text-sm text-gray-500">{formatDate(application.date_received)}</p>
                      </div>
                    </div>
                  )}
                  {application.date_validated && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Application Validated</p>
                        <p className="text-sm text-gray-500">{formatDate(application.date_validated)}</p>
                      </div>
                    </div>
                  )}
                  {application.date_decision && (
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-4 ${
                        application.decision?.toLowerCase().includes('approved') ? 'bg-green-600' :
                        application.decision?.toLowerCase().includes('refused') ? 'bg-red-600' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Decision Made</p>
                        <p className="text-sm text-gray-500">{formatDate(application.date_decision)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Applicant Details Card */}
            {canViewFullDetails && (application.applicant_name || application.agent_name) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Applicant & Agent Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {application.applicant_name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Applicant</h3>
                      <p className="text-gray-900 font-medium">{application.applicant_name}</p>
                    </div>
                  )}
                  {application.agent_name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Agent</h3>
                      <p className="text-gray-900 font-medium">{application.agent_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade Notice for Limited Users */}
            {!canViewFullDetails && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Unlock Full Application Details</h3>
                    <p className="text-blue-800 mb-4">
                      Get access to applicant details, agent information, and more comprehensive application data with a Pro or Premium plan.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Location Card */}
            {(application.lat && application.lng) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg mb-4">
                  <div className="flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="text-sm">Map integration coming soon</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Coordinates:</span></p>
                  <p className="text-gray-600 font-mono">
                    {Number(application.lat).toFixed(6)}, {Number(application.lng).toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/search"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  New Search
                </Link>
                {application.lpa_name && (
                  <Link
                    href={`/dashboard/search?council=${encodeURIComponent(application.lpa_name)}`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    More from {application.lpa_name}
                  </Link>
                )}
                {canViewFullDetails && planLimits?.csvExport && (
                  <button
                    onClick={() => window.open(`/api/export/csv?external_id=${application.external_id}`, '_blank')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}