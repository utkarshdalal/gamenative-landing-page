/** @type {import('next').NextConfig} */
const isGhPages = false
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: isGhPages ? '/gamenative-landing-page' : '',
  assetPrefix: isGhPages ? '/gamenative-landing-page/' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
