import Link from 'next/link'
import { createServiceClient } from '../../lib/supabase/pages-client'

export async function getStaticPaths() {
  try {
    const supabase = createServiceClient()

    // Get all unique council names for static generation
    const { data: councils, error } = await supabase
      .from('planning_applications')
      .select('lpa_name')
      .group('lpa_name')
      .order('lpa_name')

    if (error) {
      console.error('Error fetching councils:', error)
      return {
        paths: [],
        fallback: 'blocking'
      }
    }

    // Generate slugs from council names
    const paths = councils.map(council => ({
      params: {
        council: council.lpa_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
    }))

    return {
      paths,
      fallback: 'blocking'
    }
  } catch (error) {
    console.error('Error in getStaticPaths:', error)
    return {
      paths: [],
      fallback: 'blocking'
    }
  }
}

export async function getStaticProps({ params }) {
  try {
    const supabase = createServiceClient()
    const councilSlug = params.council

    // Find the actual council name from the slug
    const { data: allCouncils } = await supabase
      .from('planning_applications')
      .select('lpa_name')
      .group('lpa_name')

    const councilName = allCouncils?.find(c =>
      c.lpa_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === councilSlug
    )?.lpa_name

    if (!councilName) {
      return {
        notFound: true
      }
    }

    // Get stats for this council
    const { data: applications, error } = await supabase
      .from('planning_applications')
      .select('id, title, address, date_validated, decision, applicant_name, application_type')
      .eq('lpa_name', councilName)
      .order('date_validated', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching applications:', error)
    }

    // Calculate stats
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const thisMonthApplications = applications?.filter(app =>
      new Date(app.date_validated) >= thisMonth
    ).length || 0

    const approvedApplications = applications?.filter(app =>
      app.decision?.toLowerCase() === 'approved'
    ).length || 0

    const approvalRate = applications?.length > 0
      ? Math.round((approvedApplications / applications.length) * 100)
      : 0

    // Get most common application types
    const typeCounts = {}
    applications?.forEach(app => {
      if (app.application_type) {
        typeCounts[app.application_type] = (typeCounts[app.application_type] || 0) + 1
      }
    })

    const mostCommonType = Object.keys(typeCounts).length > 0
      ? Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b)
      : 'Householder'

    return {
      props: {
        councilName,
        councilSlug,
        applications: applications || [],
        stats: {
          thisMonth: thisMonthApplications,
          approvalRate,
          mostCommonType,
          totalShown: applications?.length || 0
        }
      },
      revalidate: 86400 // Revalidate daily
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return {
      notFound: true
    }
  }
}

function getStatusBadgeColor(status) {
  return 'text-white font-medium'
}

function getStatusBackgroundColor(status) {
  const statusLower = status?.toLowerCase() || ''

  // Approved/Granted - Green #22C55E
  if (statusLower.includes('approved') || statusLower.includes('granted') ||
      statusLower.includes('consent') || statusLower.includes('permission granted')) {
    return '#22C55E'
  }

  // Refused/Rejected - Red #EF4444
  if (statusLower.includes('refused') || statusLower.includes('rejected') ||
      statusLower.includes('dismissed') || statusLower.includes('declined')) {
    return '#EF4444'
  }

  // Withdrawn - Grey #9CA3AF
  if (statusLower.includes('withdrawn') || statusLower.includes('cancelled') ||
      statusLower.includes('invalid') || statusLower.includes('lapsed')) {
    return '#9CA3AF'
  }

  // Pending/Under Consideration - Amber #F59E0B (default)
  return '#F59E0B'
}

export default function CouncilPage({ councilName, councilSlug, applications, stats }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How can I search planning applications in ${councilName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can search planning applications in ${councilName} by postcode, address, or keyword. Our platform provides access to the latest planning applications with advanced filtering options.`
        }
      },
      {
        "@type": "Question",
        "name": `What types of planning applications are submitted to ${councilName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${councilName} receives various types of planning applications including householder applications, full planning applications, change of use applications, and more. The most common type is ${stats.mostCommonType}.`
        }
      },
      {
        "@type": "Question",
        "name": `How often is planning application data updated?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Planning application data is updated daily from official sources, ensuring you have access to the most recent submissions and decisions."
        }
      }
    ]
  }

  return (
    <>
      <head>
        <title>Planning Applications in {councilName} | Planning Radar</title>
        <meta
          name="description"
          content={`Browse the latest planning applications submitted to ${councilName}. Track new developments, extensions, and change of use applications with real-time data.`}
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
                <Link href="/planning-applications" className="text-secondary-light hover:text-secondary px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  All Councils
                </Link>
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
              Planning Applications in {councilName}
            </h1>
            <p className="text-xl text-secondary-light max-w-3xl mx-auto">
              Browse the latest planning applications, track development opportunities, and stay informed about new projects in {councilName}.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">{stats.thisMonth}</div>
              <div className="text-secondary-light">Applications This Month</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
              <div className="text-3xl font-bold text-success mb-2">{stats.approvalRate}%</div>
              <div className="text-secondary-light">Approval Rate</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
              <div className="text-lg font-semibold text-secondary mb-2">{stats.mostCommonType}</div>
              <div className="text-secondary-light">Most Common Type</div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden mb-12">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-secondary mb-2">Recent Planning Applications</h2>
              <p className="text-secondary-light">Latest {stats.totalShown} applications submitted to {councilName}</p>
            </div>

            {applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Address</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Description</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-secondary-light">
                          {new Date(app.date_validated).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary max-w-xs">
                          <div className="truncate">{app.address}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary max-w-sm">
                          <div className="line-clamp-2">
                            {app.title?.length > 60 ? `${app.title.substring(0, 60)}...` : app.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-light">
                          {app.application_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs ${getStatusBadgeColor(app.decision)}`}
                            style={{ backgroundColor: getStatusBackgroundColor(app.decision) }}
                          >
                            {app.decision || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-secondary-light">
                <p>No recent applications found for {councilName}.</p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-secondary mb-4">
              Get Full Access to All {councilName} Planning Applications
            </h2>
            <p className="text-xl text-secondary-light mb-8 max-w-3xl mx-auto">
              Search unlimited applications with advanced filters, save searches, export data, and track your opportunities with our Pro and Premium plans.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              Start Free Trial →
            </Link>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center text-secondary mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  How can I search planning applications in {councilName}?
                </h3>
                <p className="text-secondary-light leading-relaxed">
                  You can search planning applications in {councilName} by postcode, address, or keyword. Our platform provides access to the latest planning applications with advanced filtering options including date ranges, application types, and decision status.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  What types of planning applications are submitted to {councilName}?
                </h3>
                <p className="text-secondary-light leading-relaxed">
                  {councilName} receives various types of planning applications including householder applications (home extensions, loft conversions), full planning applications (new developments), change of use applications, and listed building consent applications. The most common type in this area is {stats.mostCommonType}.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  How often is the planning application data updated?
                </h3>
                <p className="text-secondary-light leading-relaxed">
                  Our planning application data is updated daily from official government sources, ensuring you have access to the most recent submissions and decisions from {councilName} and other London boroughs.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-secondary mb-4">
                  Can I set up alerts for new planning applications in {councilName}?
                </h3>
                <p className="text-secondary-light leading-relaxed">
                  Yes, with our Pro and Premium plans, you can save custom searches and receive notifications when new planning applications match your criteria. This is perfect for property investors and developers looking to identify opportunities in {councilName}.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation to other councils */}
          <div className="mt-16 text-center">
            <Link
              href="/planning-applications"
              className="inline-flex items-center text-primary hover:text-primary-dark font-medium text-lg transition-colors duration-200"
            >
              ← Browse All London Boroughs
            </Link>
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