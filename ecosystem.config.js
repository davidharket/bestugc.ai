// ecosystem.config.js
module.exports = {
  apps: [
    {
      // This is the main Next.js web application
      name: 'ageco-ai',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/ageco.ai', // Important: specify the working directory
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      // This is the separate BullMQ background worker
      name: 'render-worker',
      script: './dist/workers/render-worker.js', // Points to the compiled JS file
      cwd: '/var/www/ageco.ai', // Worker also runs from the project root
      instances: 1, // Crucial to run only one worker to not overload the GPU
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
