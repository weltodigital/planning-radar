'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserPlan, getUserSubscription } from '@/lib/get-user-plan'
import { getPlanLimits, getPlanDisplayName, getPlanColor, getDaysUntilTrialExpires } from '@/lib/plans'

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<string>('free_trial')
  const [planLimits, setPlanLimits] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    try {
      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get subscription data
      const { data: subscriptionData } = await (supabase
        .from('subscriptions') as any)
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSubscription(subscriptionData)

      // Get user plan
      const plan = await getUserPlan(user.id)
      setUserPlan(plan)
      setPlanLimits(getPlanLimits(plan))

    } catch (error) {
      console.error('Error loading account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        window.location.href = data.data.url
      } else {
        alert(data.error || 'Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const isTrialExpired = userPlan === 'expired' && subscription?.plan === 'free_trial'
  const isTrialActive = userPlan === 'free_trial' && subscription?.trial_ends_at
  const trialDaysLeft = isTrialActive ? getDaysUntilTrialExpires(subscription.trial_ends_at) : 0
  const hasActiveSubscription = subscription?.stripe_subscription_id && userPlan !== 'expired'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading account details...</p>
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
              <Link href="/dashboard/search" className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-200">
                Search
              </Link>
              <Link href="/dashboard/account" className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-4 -mb-4 transition-all duration-200">
                Account
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile, subscription, and account preferences.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {user?.email}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This is your login email and cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm">
                      {user?.id}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription</h2>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(userPlan)}`}>
                      {getPlanDisplayName(userPlan)}
                    </span>
                    {isTrialActive && (
                      <span className="ml-3 text-sm text-gray-600">
                        {trialDaysLeft} days left
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {userPlan === 'free_trial' || userPlan === 'expired' ? (
                    <Link
                      href="/pricing"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      Upgrade Plan
                    </Link>
                  ) : hasActiveSubscription ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      {portalLoading ? 'Loading...' : 'Manage Billing'}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Subscription Details */}
              <div className="space-y-4">
                {isTrialExpired && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-5 h-5 text-red-600 mt-0.5 mr-3">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-red-800 font-medium">Your free trial has expired</p>
                        <p className="text-red-700 text-sm mt-1">
                          Upgrade to continue accessing Planning Radar features
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isTrialActive && trialDaysLeft <= 3 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-5 h-5 text-yellow-600 mt-0.5 mr-3">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-yellow-800 font-medium">
                          Your trial expires in {trialDaysLeft} days
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                          Upgrade now to avoid interruption to your service
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subscription?.status === 'past_due' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="w-5 h-5 text-red-600 mt-0.5 mr-3">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-red-800 font-medium">Payment Required</p>
                        <p className="text-red-700 text-sm mt-1">
                          Your subscription payment failed. Please update your payment method.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasActiveSubscription && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-700"><strong>Status:</strong> {subscription.status}</p>
                        {subscription.current_period_end && (
                          <p className="text-green-700">
                            <strong>Next billing:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div>
                        {subscription.stripe_subscription_id && (
                          <p className="text-green-700 break-all"><strong>Subscription ID:</strong> {subscription.stripe_subscription_id.slice(0, 18)}...</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Usage Statistics</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                  <div className="text-sm text-gray-600">Searches This Month</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                  <div className="text-sm text-gray-600">Saved Searches</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Plan Features */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Search Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                      Council & postcode search
                    </li>
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-3 ${
                        planLimits?.keywordFilters ? 'bg-green-400' : 'bg-gray-300'
                      }`}></span>
                      Keyword search
                      {!planLimits?.keywordFilters && <span className="ml-2 text-xs text-gray-500">(Pro+)</span>}
                    </li>
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-3 ${
                        planLimits?.applicantSearch ? 'bg-green-400' : 'bg-gray-300'
                      }`}></span>
                      Applicant/agent search
                      {!planLimits?.applicantSearch && <span className="ml-2 text-xs text-gray-500">(Premium)</span>}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Data & Export</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                      {planLimits?.maxResults ? `${planLimits.maxResults} results` : 'Unlimited results'}
                    </li>
                    <li className="flex items-center">
                      <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                      {planLimits?.historyDays ? `${planLimits.historyDays} days history` : 'Full history access'}
                    </li>
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-3 ${
                        planLimits?.csvExport ? 'bg-green-400' : 'bg-gray-300'
                      }`}></span>
                      CSV export
                      {!planLimits?.csvExport && <span className="ml-2 text-xs text-gray-500">(Premium)</span>}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/search"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Applications
                </Link>
                <Link
                  href="/dashboard/saved-searches"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved Searches
                </Link>
                {(userPlan === 'free_trial' || userPlan === 'expired') && (
                  <Link
                    href="/pricing"
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upgrade Plan
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}