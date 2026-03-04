/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    ]
  },
}

module.exports = nextConfig
