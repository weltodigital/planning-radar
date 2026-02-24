import Link from 'next/link'
import { useRouter } from 'next/router'

// Sample council data - in production this would come from your database
const councilData = {
  'bristol-city-council': {
    name: 'Bristol City Council',
    totalApplications: 1245,
    approvalRate: '68%',
    avgProcessingTime: '8 weeks',
    area: 'Bristol, South West England',
    population: '467,000',
    recentApplications: [
      {
        id: 1,
        title: 'Single storey rear extension',
        address: '123 High Street, Bristol BS1 5AH',
        status: 'Approved',
        date: '2024-01-15'
      },
      {
        id: 2,
        title: 'Two storey side extension',
        address: '45 Park Road, Bristol BS2 8QW',
        status: 'Pending',
        date: '2024-01-20'
      },
      {
        id: 3,
        title: 'Change of use from retail to residential',
        address: '67 Queen Street, Bristol BS1 4DF',
        status: 'Refused',
        date: '2024-01-18'
      }
    ]
  },
  'birmingham-city-council': {
    name: 'Birmingham City Council',
    totalApplications: 2134,
    approvalRate: '72%',
    avgProcessingTime: '6 weeks',
    area: 'Birmingham, West Midlands',
    population: '1,141,000',
    recentApplications: [
      {
        id: 4,
        title: 'New detached dwelling',
        address: '89 Oak Avenue, Birmingham B1 1AA',
        status: 'Approved',
        date: '2024-01-10'
      },
      {
        id: 5,
        title: 'Loft conversion with dormer windows',
        address: '22 Elm Grove, Birmingham B2 4RT',
        status: 'Pending',
        date: '2024-01-25'
      }
    ]
  }
}

export async function getStaticPaths() {
  // Generate paths for all councils
  const paths = Object.keys(councilData).map((council) => ({
    params: { council }
  }))

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const council = councilData[params.council]

  if (!council) {
    return { notFound: true }
  }

  return {
    props: {
      council: {
        slug: params.council,
        ...council
      }
    },
    revalidate: 86400 // Revalidate once per day
  }
}

const getStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'bg-green-100 text-green-800'
    case 'refused': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function CouncilPage({ council }) {
  const router = useRouter()

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
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                Home
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link href="/planning-applications" className="text-gray-400 hover:text-gray-500">
                Planning Applications
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li className="text-gray-900 font-medium">
              {council.name}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {council.name} Planning Applications
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Track the latest planning applications submitted to {council.name}.
            Find development opportunities and monitor local planning decisions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">{council.totalApplications}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">{council.approvalRate}</div>
            <div className="text-sm text-gray-600">Approval Rate</div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">{council.avgProcessingTime}</div>
            <div className="text-sm text-gray-600">Avg Processing Time</div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">{council.population}</div>
            <div className="text-sm text-gray-600">Population</div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Planning Applications</h2>
          <div className="space-y-4">
            {council.recentApplications.map((app) => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{app.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{app.address}</p>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Date:</span> {new Date(app.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get Full Access to {council.name} Planning Data
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Search all planning applications, set up alerts, and track development opportunities
            in {council.area} with our comprehensive planning application database.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium">
              View Pricing →
            </Link>
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-12 prose max-w-none">
          <h2>About {council.name} Planning Applications</h2>
          <p>
            {council.name} serves the {council.area} area with a population of {council.population}.
            The council processes approximately {council.totalApplications} planning applications annually,
            with an average approval rate of {council.approvalRate} and processing time of {council.avgProcessingTime}.
          </p>

          <h3>Types of Planning Applications</h3>
          <ul>
            <li>Householder applications (extensions, conservatories, outbuildings)</li>
            <li>Full planning applications (new builds, major developments)</li>
            <li>Change of use applications</li>
            <li>Listed building consent</li>
            <li>Advertisement consent</li>
          </ul>

          <h3>Planning Application Process</h3>
          <p>
            Planning applications submitted to {council.name} go through a standardized process including
            validation, consultation, assessment, and decision. Our system tracks applications throughout
            this process, providing real-time updates on status changes and decisions.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">&copy; 2024 Planning Radar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}