export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Planning Radar is Live!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          The application is successfully deployed on Vercel.
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Go to Homepage
          </a>
          <br />
          <a
            href="/pricing"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            View Pricing
          </a>
        </div>
      </div>
    </div>
  )
}