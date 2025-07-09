require('dotenv').config({ path: '.env.production' });

module.exports = {
  apps: [{
    name : 'render-worker',                      // Explicit PM2 name
    script: 'npx',
    args : 'ts-node --transpile-only workers/renderWorker.ts', // Faster execution
    env  : { 
      NODE_ENV: 'production',
      REDIS_URL: process.env.REDIS_URL || '***REMOVED***' 
    }
  }]
};
