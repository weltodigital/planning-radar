export async function getServerSideProps({ res }) {
  const baseUrl = 'https://planningradar.co.uk'

  const robotsTxt = `User-agent: *
Allow: /

# High-value pages
Allow: /planning-applications
Allow: /planning-applications/*

# Marketing pages
Allow: /pricing

# Block sensitive areas
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /api/*
Disallow: /auth/*
Disallow: /_next/*
Disallow: /admin/*

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1
`

  res.setHeader(
    'Cache-Control',
    'public, max-age=86400, stale-while-revalidate=43200'
  )
  res.setHeader('Content-Type', 'text/plain')
  res.write(robotsTxt)
  res.end()

  return {
    props: {}
  }
}

// Default export required
export default function RobotsTxt() {
  // This component will never be rendered
  return null
}