import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/me/', '/api/'],
    },
    sitemap: 'https://www.changeengine.us/sitemap.xml',
  }
}
