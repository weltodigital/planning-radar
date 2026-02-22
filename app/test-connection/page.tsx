import { createClient } from '@/lib/supabase/server'

export default async function TestConnection() {
  const supabase = await createClient()

  let connectionStatus = 'Unknown'
  let sampleApps: any[] = []

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('planning_applications')
      .select('*')
      .limit(3)

    if (error) {
      connectionStatus = `Error: ${error.message}`
    } else {
      connectionStatus = 'Connected successfully!'
      sampleApps = data || []
    }
  } catch (error) {
    connectionStatus = `Connection failed: ${error}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className={`p-4 rounded ${
              connectionStatus.includes('successfully')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus}
            </div>
          </div>

          {sampleApps.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Sample Planning Applications</h2>
              <div className="space-y-4">
                {sampleApps.map((app: any) => (
                  <div key={app.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-medium">{app.title}</h3>
                    <p className="text-sm text-gray-600">{app.address}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>Council: {app.lpa_name}</span>
                      <span>Status: {app.decision}</span>
                      <span>Date: {app.date_validated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-block bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}