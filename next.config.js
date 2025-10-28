/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  webpack: (config, { isServer }) => {
    // Disable all fallbacks that might cause issues
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Add externals to prevent build issues
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Production optimizations
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, './'),
      };
    }

    return config;
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        port: "",
        pathname: "/ipfs/**",
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
