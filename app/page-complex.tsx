import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planning Radar | Track Every UK Planning Application | Free Trial',
  description: 'Get ahead with real-time UK planning application intelligence. Search 268+ councils, track opportunities, and analyze planning data. Free 7-day trial, no credit card required.',
  keywords: [
    'UK planning applications',
    'planning permission tracker',
    'property development intelligence',
    'council planning data',
    'planning application search',
    'development opportunities',
    'estate agent tools',
    'property investor tools',
    'planning consultancy',
    'UK property development'
  ],
  authors: [{ name: 'Planning Radar' }],
  creator: 'Planning Radar',
  publisher: 'Planning Radar',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://planningradar.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Planning Radar - Track Every UK Planning Application',
    description: 'Real-time planning application intelligence from 268+ UK councils. Perfect for property investors, estate agents, and developers.',
    url: 'https://planningradar.com',
    siteName: 'Planning Radar',
    locale: 'en_GB',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Planning Radar - UK Planning Application Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planning Radar - Track Every UK Planning Application',
    description: 'Real-time planning application intelligence from 268+ UK councils. Free 7-day trial.',
    creator: '@planningradar',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
}

export default function Home() {
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
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Features</a>
              <a href="/pricing" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Pricing</a>
              <a href="/api-demo" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">API</a>
              <a href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Sign In</a>
              <a
                href="/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
              >
                Start Free Trial
              </a>
            </div>
            <div className="md:hidden">
              <button className="text-slate-600 hover:text-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -top-10 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-2xl opacity-40"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 text-slate-700 text-sm font-semibold mb-8 shadow-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                  Live UK Planning Data
                </span>
                <span className="mx-2 text-slate-400">•</span>
                <span>268+ Councils Active</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold mb-8 leading-[0.9] tracking-tight">
              <span className="text-slate-900">Discover Planning</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Opportunities First
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Get ahead of the competition with <strong className="font-semibold text-slate-800">real-time planning intelligence</strong>.
              <br className="hidden sm:block" />
              Search, filter, and analyze data from every UK council in one powerful platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a
                href="/signup"
                className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-indigo-500/25 transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Start Free 7-Day Trial
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a
                href="/api-demo"
                className="group bg-white/80 backdrop-blur-sm border border-white/40 text-slate-700 px-8 py-4 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 font-semibold text-lg shadow-lg"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Watch Live Demo
                </span>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="flex items-center bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-sm">
                <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700 font-medium text-sm">7-day free trial</span>
              </div>
              <div className="flex items-center bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-sm">
                <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700 font-medium text-sm">Setup in 2 minutes</span>
              </div>
              <div className="flex items-center bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-sm">
                <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700 font-medium text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
              🚀 Simple Process
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Find Planning Opportunities in
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Three Simple Steps
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              From search to action in minutes. Our streamlined process gets you the planning intelligence you need, fast.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/25">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Search & Filter</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Enter your postcode, set your radius, and apply filters like council, date range, or keywords. Our advanced search finds exactly what you're looking for.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-10 left-full w-12 h-0.5 bg-gradient-to-r from-emerald-300 to-teal-300 transform translate-x-0"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-500/25">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Analyze Results</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Review detailed application information including addresses, applicants, decision status, and council links. Get the full picture instantly.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-10 left-full w-12 h-0.5 bg-gradient-to-r from-teal-300 to-blue-300 transform translate-x-0"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Take Action</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Export to CSV, save your searches for monitoring, or integrate via our API. Turn planning intelligence into business opportunities.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <a
              href="/signup"
              className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 inline-flex items-center"
            >
              <span className="relative z-10 flex items-center">
                Start Your Free Trial Today
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
              ✨ Powerful Features
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Everything You Need to
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Track Planning Applications
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              From search and analysis to export and monitoring, Planning Radar gives you
              <strong className="font-semibold text-slate-800">complete visibility</strong> into UK planning activity.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Powerful Search</h3>
                <p className="text-slate-600 leading-relaxed">
                  Search by postcode, council, keywords, or applicant names. Filter by date, decision status, and application type with lightning speed.
                </p>
                <div className="mt-6 flex items-center text-indigo-600 font-medium text-sm">
                  <span>Learn more</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Real-Time Data</h3>
                <p className="text-slate-600 leading-relaxed">
                  Access live planning application data updated daily from over 268 UK councils and local authorities. Never miss an opportunity.
                </p>
                <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm">
                  <span>Learn more</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Analytics & Export</h3>
                <p className="text-slate-600 leading-relaxed">
                  Export search results to CSV for detailed analysis. Built-in analytics dashboard for business intelligence and reporting.
                </p>
                <div className="mt-6 flex items-center text-purple-600 font-medium text-sm">
                  <span>Learn more</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Location Intelligence</h3>
                <p className="text-slate-600 leading-relaxed">
                  Radius-based searches around any UK postcode. Advanced geospatial analysis to find opportunities in your target areas.
                </p>
                <div className="mt-6 flex items-center text-orange-600 font-medium text-sm">
                  <span>Learn more</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Developer API</h3>
                <p className="text-slate-600 leading-relaxed">
                  Integrate planning data directly into your applications with our comprehensive RESTful API. Complete documentation included.
                </p>
                <div className="mt-6 flex items-center text-blue-600 font-medium text-sm">
                  <span>View API docs</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Enterprise Security</h3>
                <p className="text-slate-600 leading-relaxed">
                  Bank-grade security with 99.9% uptime SLA. SOC2 compliant infrastructure ensures your data is always protected and accessible.
                </p>
                <div className="mt-6 flex items-center text-violet-600 font-medium text-sm">
                  <span>Security details</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Planning Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who rely on Planning Radar for their planning intelligence
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">268+</div>
              <div className="text-gray-600 text-sm">UK Councils</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">1M+</div>
              <div className="text-gray-600 text-sm">Applications Tracked</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600 text-sm">Uptime</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600 text-sm">Data Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
              💼 Simple Pricing
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Choose Your
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              Start with a <strong className="font-semibold text-slate-800">free 7-day trial</strong>, then choose the plan that fits your business needs. No setup fees, cancel anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Free Trial</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-slate-900">£0</span>
                  <span className="text-slate-600 ml-2">for 7 days</span>
                </div>
                <p className="text-slate-600">Perfect for exploring planning applications</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10 search results
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  7 days of data history
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Basic postcode search
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime during trial
                </li>
              </ul>
              <a
                href="/signup"
                className="w-full bg-slate-100 text-slate-800 py-4 px-6 rounded-2xl font-semibold text-center hover:bg-slate-200 transition-all duration-200 block"
              >
                Start Free Trial
              </a>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-white/80 backdrop-blur-sm border-2 border-indigo-200 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Pro</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-slate-900">£49</span>
                  <span className="text-slate-600 ml-2">/month</span>
                </div>
                <p className="text-slate-600">For professionals tracking opportunities</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited search results
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  1 year data history
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced keyword search
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  5 saved searches
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  API access
                </li>
              </ul>
              <a
                href="/signup"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-center hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 block shadow-lg hover:shadow-indigo-500/25"
              >
                Start Free Trial
              </a>
            </div>

            {/* Premium Plan */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Premium</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-slate-900">£199</span>
                  <span className="text-slate-600 ml-2">/month</span>
                </div>
                <p className="text-slate-600">For teams and advanced users</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Everything in Pro
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited data history
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  CSV export (10K rows)
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Applicant & agent search
                </li>
                <li className="flex items-center text-slate-700">
                  <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited saved searches
                </li>
              </ul>
              <a
                href="/signup"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold text-center hover:from-purple-700 hover:to-purple-800 transition-all duration-200 block shadow-lg hover:shadow-purple-500/25"
              >
                Start Free Trial
              </a>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-slate-600 text-lg mb-6">
              Questions about pricing?
              <a href="mailto:support@planningradar.com" className="text-indigo-600 hover:text-indigo-700 font-semibold ml-2 transition-colors">
                Contact our team
              </a>
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              View detailed pricing comparison
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold mb-6">
              ❓ Got Questions?
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Frequently Asked
              <span className="block bg-gradient-to-r from-slate-600 to-slate-900 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              Everything you need to know about Planning Radar and UK planning application data.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                What planning data do you include?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                We track planning applications from over 268 UK councils including all major cities, districts, and boroughs.
                Our data includes application details, addresses, postcodes, applicants, agents, decision status, validation dates,
                and direct links to council portals. We cover residential, commercial, and infrastructure planning applications.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                How often is the data updated?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Planning data is updated daily from official council sources at 3 AM GMT. New applications typically appear
                within 24-48 hours of being validated by councils. We maintain over 1 million planning records with continuous
                monitoring to ensure data accuracy and completeness.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Can I export search results?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Yes! Premium subscribers can export up to 10,000 search results to CSV format for further analysis.
                Exports include all available data fields including addresses, applicant details, decision status,
                and council information. Perfect for business intelligence and market research.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Do you offer an API for developers?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Absolutely! All Pro and Premium plans include full API access with comprehensive REST endpoints.
                Our API supports all search functionality, filtering, and data export capabilities. Complete documentation,
                rate limiting, and webhook support included. Perfect for integrating planning data into your applications.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Yes, you can cancel your subscription anytime from your dashboard with immediate effect.
                You'll continue to have access until the end of your current billing period. No cancellation fees,
                no questions asked. Your data and saved searches remain accessible during your active period.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Is there a setup fee or contract required?
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                No setup fees, no contracts, no commitments. Start with a free 7-day trial that requires no credit card.
                All plans are month-to-month subscriptions that you can upgrade, downgrade, or cancel at any time.
                Perfect for businesses of all sizes, from individual consultants to large development companies.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-slate-600 text-lg mb-6">
              Still have questions?
            </p>
            <a
              href="mailto:support@planningradar.com"
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-slate-500/25 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support Team
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join professionals who use Planning Radar to stay ahead of planning opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/signup"
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Start Your Free Trial
            </a>
            <a
              href="/pricing"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-white transition-colors font-medium"
            >
              View Pricing Plans
            </a>
          </div>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Planning Radar',
            description: 'Real-time UK planning application intelligence platform for property professionals',
            url: 'https://planningradar.com',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: [
              {
                '@type': 'Offer',
                name: 'Free Trial',
                price: '0',
                priceCurrency: 'GBP',
                validFor: 'P7D',
                description: '7-day free trial with no credit card required'
              },
              {
                '@type': 'Offer',
                name: 'Pro Plan',
                price: '49',
                priceCurrency: 'GBP',
                priceSpecification: {
                  '@type': 'RecurringPaymentFrequency',
                  frequency: 'monthly'
                }
              },
              {
                '@type': 'Offer',
                name: 'Premium Plan',
                price: '199',
                priceCurrency: 'GBP',
                priceSpecification: {
                  '@type': 'RecurringPaymentFrequency',
                  frequency: 'monthly'
                }
              }
            ],
            creator: {
              '@type': 'Organization',
              name: 'Planning Radar',
              url: 'https://planningradar.com'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '127'
            }
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What planning data do you include?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We track planning applications from over 268 UK councils including all major cities, districts, and boroughs. Our data includes application details, addresses, postcodes, applicants, agents, decision status, validation dates, and direct links to council portals.'
                }
              },
              {
                '@type': 'Question',
                name: 'How often is the data updated?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Planning data is updated daily from official council sources at 3 AM GMT. New applications typically appear within 24-48 hours of being validated by councils.'
                }
              },
              {
                '@type': 'Question',
                name: 'Can I export search results?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! Premium subscribers can export up to 10,000 search results to CSV format for further analysis. Exports include all available data fields including addresses, applicant details, decision status, and council information.'
                }
              },
              {
                '@type': 'Question',
                name: 'Do you offer an API for developers?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Absolutely! All Pro and Premium plans include full API access with comprehensive REST endpoints. Our API supports all search functionality, filtering, and data export capabilities.'
                }
              },
              {
                '@type': 'Question',
                name: 'Can I cancel my subscription anytime?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, you can cancel your subscription anytime from your dashboard with immediate effect. You\'ll continue to have access until the end of your current billing period. No cancellation fees, no questions asked.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is there a setup fee or contract required?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No setup fees, no contracts, no commitments. Start with a free 7-day trial that requires no credit card. All plans are month-to-month subscriptions that you can upgrade, downgrade, or cancel at any time.'
                }
              }
            ]
          })
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">PR</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Planning Radar</span>
            </div>
            <div className="flex space-x-6 text-gray-600 text-sm">
              <a href="/pricing" className="hover:text-gray-900">Pricing</a>
              <a href="/api-demo" className="hover:text-gray-900">API</a>
              <a href="mailto:support@planningradar.com" className="hover:text-gray-900">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>&copy; 2026 Planning Radar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}