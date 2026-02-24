import { createServiceClient } from '../lib/supabase/pages-client'

function generateSiteMap(councils) {
  const baseUrl = 'https://planningradar.co.uk'

  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/login',
    '/signup',
    '/planning-applications'
  ]

  // Generate council pages
  const councilPages = councils.map(council => `/planning-applications/${council.slug}`)

  const allPages = [...staticPages, ...councilPages]

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${allPages
       .map((page) => {
         const isHomepage = page === ''
         const isCouncilPage = page.startsWith('/planning-applications/')
         const priority = isHomepage ? '1.0' : isCouncilPage ? '0.8' : '0.7'
         const changefreq = isHomepage ? 'daily' : isCouncilPage ? 'weekly' : 'monthly'

         return `
       <url>
           <loc>${baseUrl}${page}</loc>
           <lastmod>${new Date().toISOString()}</lastmod>
           <changefreq>${changefreq}</changefreq>
           <priority>${priority}</priority>
       </url>
     `
       })
       .join('')}
   </urlset>
 `
}

export async function getServerSideProps({ res }) {
  try {
    const supabase = createServiceClient()

    // Get all councils for sitemap
    const { data: councils, error } = await supabase
      .from('planning_applications')
      .select('lpa_name')
      .group('lpa_name')
      .order('lpa_name')

    if (error) {
      console.error('Error fetching councils for sitemap:', error)
    }

    const councilsWithSlugs = (councils || []).map(council => ({
      slug: council.lpa_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))

    // Generate the sitemap
    const sitemap = generateSiteMap(councilsWithSlugs)

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate'
    )
    res.setHeader('Content-Type', 'text/xml')
    res.write(sitemap)
    res.end()

    return {
      props: {}
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Return basic sitemap on error
    const basicSitemap = generateSiteMap([])
    res.setHeader('Content-Type', 'text/xml')
    res.write(basicSitemap)
    res.end()

    return {
      props: {}
    }
  }
}

// Default export required for dynamic routes
export default function Sitemap() {
  // This component will never be rendered
  return null
}