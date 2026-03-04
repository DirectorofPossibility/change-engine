/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/resourcecenter/:slug',
        destination: '/search?q=:slug',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
