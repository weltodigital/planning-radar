import Head from 'next/head'

export default function SEOHead({
  title = "Planning Radar - London Planning Applications Search",
  description = "Find development opportunities before your competitors. Search, filter, and monitor planning applications across London with real-time data. 7-day free trial.",
  canonical = "https://www.planningradar.com",
  ogImage = "https://www.planningradar.com/og-image.png"
}) {
  const fullTitle = title.includes('Planning Radar') ? title : `${title} | Planning Radar`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Favicon */}
      <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏗️</text></svg>" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Planning Radar" />

      {/* Twitter Card */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Planning Radar" />
      <meta name="keywords" content="planning applications, London planning, property development, planning permission, development opportunities, planning search" />

      {/* Theme Color */}
      <meta name="theme-color" content="#1e3a5f" />

      {/* JSON-LD Schema for SaaS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Planning Radar",
            "description": description,
            "url": canonical,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "GBP",
              "priceValidUntil": "2025-12-31",
              "availability": "https://schema.org/InStock",
              "url": canonical,
              "description": "7-day free trial, then from £79/month"
            },
            "creator": {
              "@type": "Organization",
              "name": "Planning Radar",
              "url": canonical
            }
          })
        }}
      />
    </Head>
  )
}