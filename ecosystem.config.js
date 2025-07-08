// ecosystem.config.js
module.exports = {
  apps: [
    {
      // --- Process 1: The Next.js Application ---
      name: 'ageco-ai',
      script: 'node_modules/next/dist/bin/next', // Execute Next.js directly
      args: 'start',
      exec_mode: 'fork',
      // The ONLY variable PM2 needs to set.
      // Next.js will see 'production' and automatically load your .env.production file.
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      // --- Process 2: The Inngest Dev Server ---
      name: 'inngest-worker',
      script: 'npx',
      args: 'inngest-cli dev --host 127.0.0.1 --port 8288 -u ***REMOVED***/api/inngest',
      exec_mode: 'fork',
    },
  ],
};
