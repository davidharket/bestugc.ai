// ecosystem.config.js
module.exports = {
  apps: [
    {
      // This is the main Next.js web application with polyfills
      name: 'staging-app',
      script: './server.js',
      cwd: '/var/www/staging.bestugc.ai', // Important: specify the working directory
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
        REMOTION_RENDERER_PORT: '3001',
      },
    },
    {
      // This is the separate BullMQ background worker
      name: 'staging-worker',
      script: './dist/workers/render-worker.js', // Points to the compiled JS file
      cwd: '/var/www/staging.bestugc.ai', // Worker runs from staging project root
      instances: 1, // Crucial to run only one worker to not overload the GPU
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        REMOTION_RENDERER_PORT: '3001',
      },
    },
  ],
};
