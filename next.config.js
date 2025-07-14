/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Increase API timeout for long-running operations
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // ✅ Add rewrites to handle video files properly
  async rewrites() {
    return [
      {
        source: '/renders/:path*',
        destination: '/api/serve-video/:path*',
      },
    ];
  },
  
  webpack: (config, { isServer }) => {
    // Add file system fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Configure watchOptions for better HMR
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };

    return config;
  },
  
  // Enable Fast Refresh
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 