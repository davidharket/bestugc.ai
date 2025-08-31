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
      // Prevent caching of HTML pages to avoid build manifest mismatches
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Static assets can be cached with their hash
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/upload-temp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },

      // ✅ START OF THE FIX: This new block replaces the old mp4 rule.
      // It adds CORS headers for all video types to allow Remotion access.
      {
        // This pattern matches all common video formats in any directory
        source: '/:path*.(mp4|webm|mov)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          // This header is the crucial fix that allows Remotion to access the files
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allows any origin to request this resource
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Range', // Important for video players that request parts of a file
          },
        ],
      },

      // Hero videos specifically (keeping this in case of special routing)
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
      // Add CORS headers for JavaScript files to prevent ORB blocking
      {
        source: '/(.*\\.js$)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ];
  },

  // ✅ Add rewrites to handle video files properly
  async rewrites() {
    return [
      {
        source: '/cutouts/:path*',
        destination: '/api/serve-public/cutouts/:path*',
      },
      {
        source: '/synclabs/:path*',
        destination: '/api/serve-public/synclabs/:path*',
      },
      {
        source: '/generated_audio/:path*',
        destination: '/api/serve-public/generated_audio/:path*',
      },      
     {
        source: '/renders/:path*',
        destination: '/api/serve-video/:path*',
      },
      // Remove b-roll API routing - serve as static files instead
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
