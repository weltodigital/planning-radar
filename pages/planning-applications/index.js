import Link from 'next/link'
import { createServiceClient } from '../../lib/supabase/pages-client'

export async function getStaticProps() {
  try {
    const supabase = createServiceClient()

    // Get all councils with application counts
    const { data: councils, error } = await supabase
      .from('planning_applications')
      .select('lpa_name')
      .group('lpa_name')
      .order('lpa_name')

    if (error) {
      console.error('Error fetching councils:', error)
      return {
        props: {
          councils: []
        },
        revalidate: 86400 // Revalidate daily
      }
    }

    // Get application counts for each council
    const councilsWithCounts = await Promise.all(
      councils.map(async (council) => {
        const { data, error } = await supabase
          .from('planning_applications')
          .select('id', { count: 'exact' })
          .eq('lpa_name', council.lpa_name)

        const slug = council.lpa_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        return {
          name: council.lpa_name,
          slug,
          applicationCount: error ? 0 : (data?.length || 0)
        }
      })
    )

    // Sort by application count descending
    const sortedCouncils = councilsWithCounts.sort((a, b) => b.applicationCount - a.applicationCount)

    return {
      props: {
        councils: sortedCouncils
      },
      revalidate: 86400 // Revalidate daily
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return {
      props: {
        councils: []
      },
      revalidate: 86400
    }
  }
}

export default function PlanningApplicationsIndex({ councils }) {
  const totalApplications = councils.reduce((sum, council) => sum + council.applicationCount, 0)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "London Planning Applications by Borough",
    "description": "Browse planning applications by borough across London. Track development opportunities and planning decisions.",
    "url": "https://planningradar.co.uk/planning-applications",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": councils.length,
      "itemListElement": councils.slice(0, 10).map((council, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "GovernmentOrganization",
          "name": council.name,
          "url": `https://planningradar.co.uk/planning-applications/${council.slug}`
        }
      }))
    }
  }

  return (
    <>
      <head>
        <title>London Planning Applications by Borough | Planning Radar</title>
        <meta
          name="description"
          content="Browse planning applications by borough across London. Track development opportunities, monitor approval rates, and stay informed about planning decisions in your area."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-shrink-0">
                <Link href="/" className="text-2xl font-bold text-secondary tracking-tight">
                  Planning Radar
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/pricing" className="text-secondary-light hover:text-secondary px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Pricing
                </Link>
                <Link href="/login" className="bg-white text-secondary border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 mr-2">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-all duration-200 shadow-sm">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-secondary mb-6 tracking-tight">
              London Planning Applications by Borough
            </h1>
            <p className="text-xl text-secondary-light max-w-4xl mx-auto leading-relaxed">
              Browse planning applications by borough across London. Track development opportunities,
              monitor approval rates, and stay informed about planning decisions in your area.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg text-center">
              <div className="text-3xl font-bold text-primary mb-2">{councils.length}</div>
              <div className="text-secondary-light">Planning Authorities</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg text-center">
              <div className="text-3xl font-bold text-success mb-2">{totalApplications.toLocaleString()}</div>
              <div className="text-secondary-light">Total Applications</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg text-center">
              <div className="text-3xl font-bold text-accent mb-2">Daily</div>
              <div className="text-secondary-light">Data Updates</div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary mb-2">Find Your Local Council</h2>
              <p className="text-secondary-light">Search or browse through all London boroughs</p>
            </div>

            <div className="max-w-md mx-auto mb-8">
              <input
                type="text"
                placeholder="Search councils..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase()
                  const councilCards = document.querySelectorAll('[data-council]')
                  councilCards.forEach(card => {
                    const councilName = card.getAttribute('data-council').toLowerCase()
                    card.style.display = councilName.includes(searchTerm) ? 'block' : 'none'
                  })
                }}
              />
            </div>
          </div>

          {/* Council Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {councils.map((council) => (
              <Link
                key={council.slug}
                href={`/planning-applications/${council.slug}`}
                data-council={council.name}
                className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-secondary group-hover:text-primary transition-colors duration-200">
                    {council.name}
                  </h2>
                  <span className="text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {council.applicationCount} apps
                  </span>
                </div>

                <div className="text-3xl font-bold text-primary mb-2">
                  {council.applicationCount.toLocaleString()}
                </div>
                <div className="text-secondary-light text-sm">
                  Planning Applications Available
                </div>

                <div className="mt-4 text-primary font-medium text-sm group-hover:text-primary-dark transition-colors duration-200">
                  View Applications →
                </div>
              </Link>
            ))}
          </div>

          {councils.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-secondary mb-2">No Council Data Available</h3>
              <p className="text-secondary-light">
                Planning data is currently being synchronized. Please check back later.
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              Search All London Planning Applications
            </h2>
            <p className="text-xl text-secondary-light mb-8 max-w-3xl mx-auto">
              Get full access to our comprehensive database of London planning applications.
              Search by postcode, filter by status, and track development opportunities across all {councils.length} planning authorities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              >
                Start Free Trial →
              </Link>
              <Link
                href="/pricing"
                className="text-primary hover:text-primary-dark font-medium text-lg transition-colors duration-200"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-bold text-secondary mb-6">About London Planning Applications</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">Planning Authority Coverage</h3>
                <p className="text-secondary-light leading-relaxed">
                  Our platform covers all {councils.length} local planning authorities across England and Wales,
                  providing comprehensive access to planning application data from major cities to rural districts.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">Real-Time Data</h3>
                <p className="text-secondary-light leading-relaxed">
                  Planning application data is updated daily from official government sources, ensuring you have
                  access to the latest submissions, decisions, and status changes across London.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">Application Types</h3>
                <p className="text-secondary-light leading-relaxed">
                  Track all types of planning applications including householder applications, full planning
                  applications, change of use, listed building consent, and advertisement consent.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">Business Intelligence</h3>
                <p className="text-secondary-light leading-relaxed">
                  Perfect for property investors, estate agents, developers, and planning consultants
                  looking to identify opportunities and stay ahead of the competition.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/60 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-muted">&copy; 2024 Planning Radar. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}