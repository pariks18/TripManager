import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/dashboard/*', '/api/', '/join/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
