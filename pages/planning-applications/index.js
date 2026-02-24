import Link from 'next/link'

const councils = [
  {
    slug: 'bristol-city-council',
    name: 'Bristol City Council',
    applications: 1245,
    area: 'Bristol, South West England'
  },
  {
    slug: 'birmingham-city-council',
    name: 'Birmingham City Council',
    applications: 2134,
    area: 'Birmingham, West Midlands'
  }
]

export default function PlanningApplicationsIndex() {
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
            <div className="flex space-x-4">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Pricing
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            UK Planning Applications by Council
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse planning applications by local authority. Track development opportunities,
            monitor approval rates, and stay informed about planning decisions in your area.
          </p>
        </div>

        {/* Council Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {councils.map((council) => (
            <Link
              key={council.slug}
              href={`/planning-applications/${council.slug}`}
              className="bg-white rounded-lg border hover:border-blue-300 p-6 transition-colors"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{council.name}</h2>
              <p className="text-gray-600 mb-4">{council.area}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">{council.applications}</span>
                <span className="text-sm text-gray-500">applications</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Search All UK Planning Applications
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get full access to our comprehensive database of UK planning applications.
            Search by postcode, filter by status, and track development opportunities.
          </p>
          <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">&copy; 2024 Planning Radar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}