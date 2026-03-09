/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other Next.js config options here...

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://translate.googleapis.com https://translate.google.com https://translate-pa.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://www.gstatic.com; img-src 'self' blob: data: https://img.youtube.com https://i.ytimg.com https://images.unsplash.com https://flagcdn.com https://translate.googleapis.com http://translate.google.com https://translate.google.com https://www.google.com https://www.gstatic.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.youtube.com https://translate.google.com; connect-src 'self' https://generativelanguage.googleapis.com https://translate.googleapis.com https://translate-pa.googleapis.com"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;