import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/get-user-plan'
import { getPlanLimits, getPlanDisplayName, getDaysUntilTrialExpires } from '@/lib/plans'
import SubscriptionManagement from '@/components/SubscriptionManagement'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { welcome?: string; upgrade?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's subscription info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get user plan
  const userPlan = await getUserPlan(user.id)
  const planLimits = getPlanLimits(userPlan)

  const isWelcome = searchParams.welcome === 'true'
  const upgradeSuccess = searchParams?.upgrade === 'success'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Planning Radar</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="/dashboard" className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-4 -mb-4 transition-all duration-200">
                Dashboard
              </a>
              <a href="/dashboard/search" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
                Search
              </a>
              <a href="/dashboard/saved-searches" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
                Saved Searches
              </a>
              <a href="/dashboard/account" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
                Account
              </a>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {getPlanDisplayName(userPlan)}
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-200 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-sm font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-slate-500 hover:text-slate-700 p-1 transition-all duration-200"
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
        {isWelcome && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-lg border border-emerald-200/50 rounded-xl p-6 mb-8 shadow-lg shadow-emerald-100/50">
            <h2 className="text-emerald-900 font-bold mb-3 text-lg">🎉 Welcome to Planning Radar!</h2>
            <p className="text-emerald-800">
              Your free trial is now active. You have full access for the next 7 days.
            </p>
          </div>
        )}

        {upgradeSuccess && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-lg border border-emerald-200/50 rounded-xl p-6 mb-8 shadow-lg shadow-emerald-100/50">
            <h2 className="text-emerald-900 font-bold mb-3 text-lg">🎉 Upgrade Successful!</h2>
            <p className="text-emerald-800">
              Your subscription has been activated. You now have access to all {getPlanDisplayName(userPlan)} features.
            </p>
          </div>
        )}

        {/* Subscription Management */}
        <SubscriptionManagement
          subscription={subscription}
          userPlan={userPlan}
        />

        {/* Dashboard Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Welcome back!</h1>
          <p className="text-gray-600 text-lg">Here's what's happening with your Planning Radar account.</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Searches Today</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Results Limit</p>
                <p className="text-3xl font-bold text-gray-900">
                  {planLimits.maxResults || '∞'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">History Access</p>
                <p className="text-3xl font-bold text-gray-900">
                  {planLimits.historyDays ? `${planLimits.historyDays}d` : 'All'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Plan Status</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {userPlan.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/40 p-8 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8">Quick Actions</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a
              href="/dashboard/search"
              className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-bold mb-2 text-lg">Search Applications</h3>
                <p className="text-sm text-white/90">Find planning applications with our powerful search tools</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            <a
              href="/api-demo"
              className="group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="font-bold mb-2 text-lg">API Demo</h3>
                <p className="text-sm text-white/90">Explore our RESTful API endpoints and integration options</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            <a
              href="/pricing"
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-bold mb-2 text-lg">Upgrade Plan</h3>
                <p className="text-sm text-white/90">Unlock premium features and increased limits</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/40 p-8">
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">Account Information</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200/50">
              <span className="font-semibold text-gray-600">Email</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200/50">
              <span className="font-semibold text-gray-600">User ID</span>
              <span className="text-gray-900 font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-semibold text-gray-600">Account created</span>
              <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}