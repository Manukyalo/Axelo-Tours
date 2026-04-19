import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://axelotours.co.ke'
  const supabase = await createClient()

  // Fetch all packages for dynamic routes
  const { data: packages } = await supabase
    .from('packages')
    .select('slug, updated_at')
    .eq('available', true)

  const packageRoutes = (packages || []).map((pkg) => ({
    url: `${baseUrl}/safaris/${pkg.slug}`,
    lastModified: pkg.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const staticRoutes = [
    '',
    '/safaris',
    '/about',
    '/contact',
    '/portal',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.7,
  }))

  return [...staticRoutes, ...packageRoutes]
}
