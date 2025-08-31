// ecosystem.config.js
module.exports = {
  apps: [
    {
      // This is the main Next.js web application
      name: 'ageco-ai',
      script: 'server.js',
      cwd: '/var/www/ageco.ai',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
	REMOTION_RENDER_PORT: 3001,
      },
    },
    {
      // This is the separate BullMQ background worker
      name: 'render-worker',
      script: './dist/workers/render-worker.js',
      cwd: '/var/www/ageco.ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        REMOTION_RENDERER_PORT: 3001, // This forces Remotion to use a safe port
      },
    },
    {
      // Port 3003 to 3000 proxy for Remotion bundle server
      name: 'port-proxy',
      script: './proxy-server.js',
      cwd: '/var/www/ageco.ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
