import Link from 'next/link'
import SEOHead from '../components/SEOHead'
import { analytics } from '../components/Analytics'
import { createServiceClient } from '../lib/supabase/pages-client'

export async function getStaticProps() {
  try {
    const supabase = createServiceClient()

    const { data: latestApplications, error } = await supabase
      .from('planning_applications')
      .select('id, address, lpa_name, title, date_validated, decision')
      .order('date_validated', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching latest applications:', error)
      return {
        props: {
          latestApplications: []
        },
        revalidate: 3600 // Revalidate every hour
      }
    }

    return {
      props: {
        latestApplications: latestApplications || []
      },
      revalidate: 3600 // Revalidate every hour
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return {
      props: {
        latestApplications: []
      },
      revalidate: 3600
    }
  }
}

export default function Home({ latestApplications }) {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-secondary tracking-tight">Planning Radar</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/pricing" className="text-secondary-light hover:text-secondary px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                Pricing
              </Link>
              <Link href="/login" className="bg-white text-secondary border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 mr-2">
                Sign In
              </Link>
              <Link href="/signup" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-all duration-200 shadow-sm">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-6xl lg:text-7xl font-bold text-secondary mb-8 leading-tight tracking-tight">
            Track Every London
            <span className="block text-primary">Planning Application</span>
          </h1>
          <p className="text-xl lg:text-2xl text-secondary-light mb-12 max-w-4xl mx-auto leading-relaxed">
            Find development opportunities before your competitors. Search, filter, and monitor planning applications across London with real-time data.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <input
              type="text"
              placeholder="Enter postcode or area..."
              className="w-full sm:w-96 px-5 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm text-lg placeholder-slate-400"
            />
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              onClick={() => analytics.trackSignup('free_trial')}
            >
              Start Free Trial
            </Link>
          </div>
          <div className="flex justify-center">
            <Link href="/demo" className="text-primary hover:text-primary-dark font-medium text-lg transition-colors duration-200">
              Try Live Demo →
            </Link>
          </div>
          <p className="text-sm text-muted mt-4">7-day free trial • No credit card required</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-secondary mb-6 tracking-tight">How It Works</h2>
          <p className="text-xl text-secondary-light">Three simple steps to find planning opportunities</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          <div className="text-center">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-secondary mb-4">Search</h3>
            <p className="text-lg text-secondary-light leading-relaxed">Enter any London postcode or borough to find planning applications</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-br from-success/20 to-success/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-secondary mb-4">Filter</h3>
            <p className="text-lg text-secondary-light leading-relaxed">Use advanced filters to find exactly what you&apos;re looking for</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-br from-accent/20 to-accent/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold text-secondary mb-4">Act</h3>
            <p className="text-lg text-secondary-light leading-relaxed">Export data, save searches, and track your opportunities</p>
          </div>
        </div>
      </div>

      {/* Latest Planning Applications Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-secondary mb-6 tracking-tight">Latest Applications Submitted Today</h2>
          <p className="text-xl text-secondary-light">Live data from London boroughs and planning authorities</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {latestApplications && latestApplications.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Address</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Council</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Description</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latestApplications.map((app, index) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-secondary-light">
                          {new Date(app.date_validated).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary max-w-xs">
                          <div className="truncate">{app.address}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-light">
                          {app.lpa_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary max-w-sm">
                          <div className="line-clamp-2">
                            {app.title?.length > 80 ? `${app.title.substring(0, 80)}...` : app.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            app.decision?.toLowerCase() === 'approved' ? 'bg-success/10 text-success' :
                            app.decision?.toLowerCase() === 'refused' ? 'bg-danger/10 text-danger' :
                            app.decision?.toLowerCase() === 'pending' ? 'bg-warning/10 text-warning' :
                            'bg-muted/10 text-muted'
                          }`}>
                            {app.decision || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-8 bg-slate-50/30 border-t border-slate-100 text-center">
                <p className="text-secondary-light mb-4">Want to search all planning applications with advanced filters?</p>
                <Link href="/signup" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl">
                  Search all planning applications →
                </Link>
              </div>
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-secondary mb-2">Planning Data Loading</h3>
              <p className="text-secondary-light mb-6">We're currently syncing the latest planning applications from London boroughs.</p>
              <Link href="/signup" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl">
                Start Free Trial →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-slate-50/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-secondary mb-6 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-xl text-secondary-light">Choose the plan that works for your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-4">Free Trial</h3>
              <div className="text-3xl font-bold mb-4">£0 <span className="text-sm font-normal text-gray-500">for 7 days</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Search by postcode or council</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>10 results per search</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Last 7 days of data</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Basic application info</li>
              </ul>
              <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-md font-medium">Current Plan</button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border-2 border-accent p-8 relative transform hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-4">Pro</h3>
              <div className="text-3xl font-bold mb-4">£79 <span className="text-sm font-normal text-gray-500">per month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Unlimited results</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>12 months historical data</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Keyword filters</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Full application detail</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>5 saved searches</li>
              </ul>
              <button className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md">
                Start Free Trial
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-4">Premium</h3>
              <div className="text-3xl font-bold mb-4">£299 <span className="text-sm font-normal text-gray-500">per month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Everything in Pro</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Unlimited historical data</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Unlimited saved searches</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>CSV export</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Applicant & agent search</li>
              </ul>
              <button className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted">&copy; 2024 Planning Radar. All rights reserved.</p>
            <p className="text-muted text-sm mt-2">Powered by GLA Planning London Datahub</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}