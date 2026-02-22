import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'UK Planning Applications by Council | Planning Radar',
  description: 'Browse planning applications from over 268 UK councils and local authorities. Real-time planning data updated daily from official sources.',
  keywords: [
    'UK planning applications',
    'council planning data',
    'local authority planning',
    'planning permission tracker',
    'development applications',
    'property development UK'
  ],
  openGraph: {
    title: 'UK Planning Applications by Council',
    description: 'Browse planning applications from over 268 UK councils. Real-time data updated daily.',
    type: 'website',
    locale: 'en_GB',
  },
}

async function getCouncilsData() {
  const supabase = await createClient()

  // Get all unique councils with counts
  const { data: applications } = await supabase
    .from('planning_applications')
    .select('lpa_name')
    .limit(5000)

  if (!applications) return []

  // Count applications per council
  const councilCounts = applications.reduce((acc, app) => {
    acc[app.lpa_name] = (acc[app.lpa_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Convert to array and sort by count
  return Object.entries(councilCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export default async function PlanningApplicationsPage() {
  const councils = await getCouncilsData()

  const formatCouncilName = (council: string) => {
    return council.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

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
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
            🏛️ All UK Councils
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            UK Planning Applications
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              by Council
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto font-light leading-relaxed">
            Browse planning applications from over 268 UK councils and local authorities.
            Real-time planning data updated daily from official government sources.
          </p>
        </div>

        {/* Council Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {councils.map((council) => (
            <Link
              key={council.name}
              href={`/planning-applications/${council.name}`}
              className="group bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {formatCouncilName(council.name)}
                </h3>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="flex items-center text-slate-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">{council.count.toLocaleString()} applications tracked</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white mb-16">
          <h2 className="text-3xl font-bold mb-4">Track All UK Planning Activity</h2>
          <p className="text-indigo-100 mb-6 text-lg max-w-2xl mx-auto">
            Get unlimited access to planning applications from all UK councils with advanced search,
            filtering, and real-time notifications.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-bold shadow-lg transform hover:scale-105"
          >
            Start Your Free 7-Day Trial
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            About UK Planning Applications
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                How many councils are covered?
              </h3>
              <p className="text-slate-600">
                We track planning applications from over 268 UK councils and local authorities,
                covering England, Scotland, Wales, and Northern Ireland.
              </p>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                How often is data updated?
              </h3>
              <p className="text-slate-600">
                Planning application data is updated daily at 3 AM GMT from official council sources.
                New applications typically appear within 24-48 hours.
              </p>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                What information is included?
              </h3>
              <p className="text-slate-600">
                Each application includes full address details, description, applicant information,
                validation dates, decision status, and direct links to official council documentation.
              </p>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Can I search across all councils?
              </h3>
              <p className="text-slate-600">
                Yes! With a Planning Radar account, you can search across all councils simultaneously,
                set up saved searches, and receive notifications for new applications.
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
            '@type': 'CollectionPage',
            name: 'UK Planning Applications by Council',
            description: 'Browse planning applications from over 268 UK councils and local authorities.',
            url: 'https://planningradar.co.uk/planning-applications',
            mainEntity: {
              '@type': 'ItemList',
              name: 'UK Council Planning Applications',
              description: 'Planning applications organized by UK local authorities',
              numberOfItems: councils.length,
              itemListElement: councils.slice(0, 10).map((council, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'WebPage',
                  name: `${formatCouncilName(council.name)} Planning Applications`,
                  url: `https://planningradar.co.uk/planning-applications/${council.name}`,
                  description: `Planning applications from ${formatCouncilName(council.name)}`
                }
              }))
            }
          })
        }}
      />
    </div>
  )
}