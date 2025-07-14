/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
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

    return config;
  },
  images: {
    remotePatterns: [
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
  },
};

module.exports = nextConfig;
