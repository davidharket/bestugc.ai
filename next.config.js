/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Increase API timeout for long-running operations
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  
  
  // Configure API routes and video headers
  async headers() {
    return [
      {
        source: '/api/upload-temp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Add proper headers for video files
      {
        source: '/(.*\\.mp4$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Content-Type',
            value: 'video/mp4',
          },
        ],
      },
      // Hero videos specifically
      {
        source: '/hero:num.mp4',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Content-Type',
            value: 'video/mp4',
          },
        ],
      },
    ];
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