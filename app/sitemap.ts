import { MetadataRoute } from 'next'
import { createStaticClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://planningradar.com'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/planning-applications`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]

  // Get all unique councils for dynamic pages
  const supabase = createStaticClient()
  const { data: councils } = await supabase
    .from('planning_applications')
    .select('lpa_name')
    .limit(5000)

  const uniqueCouncils = councils ? [...new Set((councils as any[]).map(c => c.lpa_name))] : []

  // Generate council pages
  const councilPages = uniqueCouncils.map(council => ({
    url: `${baseUrl}/planning-applications/${council}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...councilPages]
}