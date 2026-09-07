import { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: ['/welcome', '/login', '/privacy', '/terms'],
      disallow: [
        '/',
        '/plan',
        '/basket',
        '/split',
        '/account',
        '/settings',
        '/pantry',
        '/leftovers',
        '/recipes',
        '/onboarding',
        '/dev',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
