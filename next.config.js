/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['argovis-api.colorado.edu'],
  },
  serverExternalPackages: ['three', 'plotly.js-dist-min'],
  webpack: (config, { isServer }) => {
    // Handle Three.js and other client-side libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  env: {
    // Environment variables available to the frontend
    ARGOVIS_BASE_URL: process.env.ARGOVIS_BASE_URL || 'https://argovis-api.colorado.edu',
    ARGOVIS_API_KEY: process.env.ARGOVIS_API_KEY || '748fbfd67cd8556d064a0dd54351ce0ef89d4f08',
  }
}

module.exports = nextConfig
