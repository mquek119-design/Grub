import { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()

  return [
    {
      url: `${baseUrl}/welcome`,
    },
    {
      url: `${baseUrl}/login`,
    },
    {
      url: `${baseUrl}/privacy`,
    },
    {
      url: `${baseUrl}/terms`,
    },
  ]
}
