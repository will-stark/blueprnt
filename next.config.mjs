/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self' https://auth.privy.io https://verify.walletconnect.com",
              "frame-src 'self' https://auth.privy.io https://verify.walletconnect.com https://farcaster.xyz",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
