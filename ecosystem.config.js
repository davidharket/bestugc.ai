// ecosystem.config.js
module.exports = {
  apps: [
    {
      // This is now the ONLY process. It will serve the website
      // and execute background jobs via its /api/inngest endpoint.
      name: 'ageco-ai',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
    }
  ]
};
