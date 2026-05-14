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
              // frame-ancestors: who is allowed to embed this app in an iframe.
              // Farcaster / Warpcast MUST be listed here or the mini-app shows a blank screen.
              "frame-ancestors 'self' https://auth.privy.io https://verify.walletconnect.com https://warpcast.com https://*.warpcast.com https://farcaster.xyz https://*.farcaster.xyz",
              // frame-src: what this app is allowed to embed inside itself.
              "frame-src 'self' https://auth.privy.io https://verify.walletconnect.com https://farcaster.xyz https://*.farcaster.xyz",
            ].join('; '),
          },
          {
            // Belt-and-suspenders for older clients; CSP frame-ancestors takes
            // precedence in modern browsers but X-Frame-Options covers the rest.
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ]
  },
}

export default nextConfig
