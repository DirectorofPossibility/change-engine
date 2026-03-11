/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'xesojwzcnjqtpuossmuv.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'bioguide.congress.gov' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.wikimedia.org' },
      { protocol: 'https', hostname: '**.wikipedia.org' },
      { protocol: 'https', hostname: '**.usaspending.gov' },
      { protocol: 'https', hostname: '**.legistar.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/resourcecenter/:slug',
        destination: '/search?q=:slug',
        permanent: false,
      },
      {
        source: '/neighborhoods',
        destination: '/geography',
        permanent: true,
      },
      {
        source: '/super-neighborhoods',
        destination: '/geography',
        permanent: true,
      },
      {
        source: '/super-neighborhoods/:path*',
        destination: '/geography?superNeighborhood=:path*',
        permanent: true,
      },
      {
        source: '/library/:id((?!category|doc|chat)[a-f0-9-]{36})',
        destination: '/library/doc/:id',
        permanent: true,
      },
      {
        source: '/pathways/our-health',
        destination: '/pathways/health',
        permanent: true,
      },
      {
        source: '/pathways/our-families',
        destination: '/pathways/families',
        permanent: true,
      },
      {
        source: '/pathways/our-neighborhood',
        destination: '/pathways/neighborhood',
        permanent: true,
      },
      {
        source: '/pathways/our-voice',
        destination: '/pathways/voice',
        permanent: true,
      },
      {
        source: '/pathways/our-money',
        destination: '/pathways/money',
        permanent: true,
      },
      {
        source: '/pathways/our-planet',
        destination: '/pathways/planet',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
