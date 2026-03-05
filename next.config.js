/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/design1',
        destination: '/templates/journey-v3-2026-03.html',
      },
    ]
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
    ]
  },
}

module.exports = nextConfig
