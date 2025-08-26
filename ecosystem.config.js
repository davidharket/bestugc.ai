// ecosystem.config.js
module.exports = {
  apps: [
    {
      // This is the main Next.js web application
      name: 'ageco-ai',
      script: 'server.js', // This is the key change: we now run your custom server file.
      cwd: '/var/www/ageco.ai',
      instances: 'max', // Use all available CPU cores for high availability
      exec_mode: 'cluster',
      wait_ready: true, // This will now work because server.js sends the 'ready' signal.
      listen_timeout: 10000, // Wait 10 seconds for the app to be ready
      kill_timeout: 5000, // Wait 5 seconds for a graceful shutdown
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      // This is the separate BullMQ background worker (configuration is unchanged)
      name: 'render-worker',
      script: './dist/workers/render-worker.js',
      cwd: '/var/www/ageco.ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
