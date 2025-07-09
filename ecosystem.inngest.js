// ecosystem.inngest.js  – runs only the Inngest mini-cloud
require('dotenv').config({ path: '.env.production' });

module.exports = {
  apps: [
    {
      name : 'inngest-server',
      script: 'npx',
      args : [
        'ingest-cli@0.24',            // exact version
        'start',                      // ← **not** “dev”
        '--host', '127.0.0.1',
        '--port', '8288',
        '--sdk-url', '***REMOVED***/api/inngest',
        '--event-key',   process.env.INNGEST_EVENT_KEY,
        '--signing-key', process.env.INNGEST_SIGNING_KEY,
      ].join(' '),

      env: {
        // the SDK inside Next.js needs these two to sign/auth events
        INNGEST_EVENT_KEY  : process.env.INNGEST_EVENT_KEY,
        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
      },
    },
  ],
};
