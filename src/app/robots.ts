import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Sitemap {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://geoworldlook.com/sitemap.xml',
  } as any
}
