import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient, createStaticClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface CouncilPageProps {
  params: Promise<{
    council: string
  }>
}

// Generate static params for all councils
export async function generateStaticParams() {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('planning_applications')
    .select('lpa_name')
    .limit(5000)

  if (error || !data) {
    return []
  }

  // Get unique council names
  const uniqueCouncils = [...new Set((data as any[]).map(item => item.lpa_name))]

  return uniqueCouncils.map((council) => ({
    council: council,
  }))
}

// Generate metadata for each council page
export async function generateMetadata({ params }: CouncilPageProps): Promise<Metadata> {
  const { council } = await params
  const councilName = council.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')

  return {
    title: `${councilName} Planning Applications | Planning Radar`,
    description: `Browse the latest planning applications submitted to ${councilName}. Track new developments, extensions, and change of use applications with real-time updates.`,
    keywords: [
      `${councilName} planning applications`,
      `${councilName} planning permission`,
      `${councilName} development`,
      `${councilName} building applications`,
      'UK planning data',
      'property development',
      'planning tracker'
    ],
    openGraph: {
      title: `${councilName} Planning Applications`,
      description: `Latest planning applications from ${councilName}. Real-time planning data and development tracking.`,
      type: 'website',
      locale: 'en_GB',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

async function getCouncilData(council: string) {
  const supabase = await createClient()

  // Get recent applications for this council
  const { data: applications, error: appsError } = await supabase
    .from('planning_applications')
    .select('*')
    .eq('lpa_name', council)
    .order('date_validated', { ascending: false })
    .limit(10)

  // Get council statistics
  const { count: totalCount } = await supabase
    .from('planning_applications')
    .select('*', { count: 'exact', head: true })
    .eq('lpa_name', council)

  // Get applications from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: recentCount } = await supabase
    .from('planning_applications')
    .select('*', { count: 'exact', head: true })
    .eq('lpa_name', council)
    .gte('date_validated', thirtyDaysAgo.toISOString())

  // Get approval rate
  const { count: approvedCount } = await supabase
    .from('planning_applications')
    .select('*', { count: 'exact', head: true })
    .eq('lpa_name', council)
    .eq('decision', 'Approved')

  const approvalRate = totalCount && approvedCount ? Math.round((approvedCount / totalCount) * 100) : 0

  if (appsError || !applications) {
    return null
  }

  return {
    applications,
    stats: {
      total: totalCount || 0,
      recent: recentCount || 0,
      approvalRate
    }
  }
}

export default async function CouncilPage({ params }: CouncilPageProps) {
  const { council } = await params
  const councilData = await getCouncilData(council)

  if (!councilData) {
    notFound()
  }

  const councilName = council.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navigation */}
      <nav className="backdrop-blur-lg bg-white/80 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Planning Radar</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Home</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Pricing</Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Sign In</Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
            📍 Local Authority
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            {councilName}
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Planning Applications
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl font-light leading-relaxed">
            Browse the latest planning applications submitted to {councilName}. Track new developments,
            extensions, and change of use applications with real-time updates from official council sources.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-slate-600">Total Applications</p>
                <p className="text-3xl font-bold text-slate-900">{councilData.stats.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-slate-600">Last 30 Days</p>
                <p className="text-3xl font-bold text-slate-900">{councilData.stats.recent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-slate-600">Approval Rate</p>
                <p className="text-3xl font-bold text-slate-900">{councilData.stats.approvalRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/40 p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Recent Planning Applications</h2>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
            >
              Get Full Access
            </Link>
          </div>

          <div className="space-y-4">
            {(councilData.applications as any[]).slice(0, 5).map((app: any, index) => (
              <div key={app.id} className="border-b border-slate-200/50 pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">{app.title}</h3>
                    <p className="text-slate-600 text-sm mb-2">{app.address}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span>Validated: {new Date(app.date_validated).toLocaleDateString('en-GB')}</span>
                      {app.decision && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.decision === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          app.decision === 'Refused' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {app.decision}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {councilData.applications.length > 5 && (
            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-xl p-6">
                <p className="text-slate-600 mb-4">
                  <strong>+{councilData.applications.length - 5} more applications</strong> available with full access
                </p>
                <Link
                  href="/signup"
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Track All {councilName} Planning Activity</h3>
          <p className="text-indigo-100 mb-6 text-lg">
            Get unlimited access to all planning applications, advanced search filters, and real-time notifications.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-bold shadow-lg transform hover:scale-105"
          >
            Start Your Free 7-Day Trial
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            About {councilName} Planning Applications
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                How often is data updated?
              </h3>
              <p className="text-slate-600">
                Planning application data for {councilName} is updated daily from official council sources.
                New applications typically appear within 24-48 hours of validation.
              </p>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                What information is included?
              </h3>
              <p className="text-slate-600">
                Each application includes the full address, description, applicant details, validation dates,
                decision status, and direct links to the official council documentation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${councilName} Planning Applications`,
            description: `Latest planning applications from ${councilName}. Real-time planning data and development tracking.`,
            url: `https://planningradar.com/planning-applications/${council}`,
            mainEntity: {
              '@type': 'GovernmentOrganization',
              name: councilName,
              areaServed: {
                '@type': 'Place',
                name: councilName.replace(' Council', '')
              }
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://planningradar.com'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Planning Applications',
                  item: 'https://planningradar.com/planning-applications'
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: councilName,
                  item: `https://planningradar.com/planning-applications/${council}`
                }
              ]
            }
          })
        }}
      />
    </div>
  )
}