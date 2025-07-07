// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'ageco-ai',
      script: 'npm',
      args: 'run start',
      cwd: '/var/www/ageco.ai',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/ageco.ai/logs/err.log',
      out_file: '/var/www/ageco.ai/logs/out.log',
      log_file: '/var/www/ageco.ai/logs/combined.log',
      time: true,
      // --- CORRECTED ENV BLOCK ---
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:./dev.db",
        AZURE_OPENAI_API_KEY: "***REMOVED***",
        AZURE_OPENAI_ENDPOINT: "***REMOVED***",
        AZURE_OPENAI_DEPLOYMENT_NAME: "gpt-4o",
        AZURE_OPENAI_API_VERSION: "2025-01-01-preview",
        ELEVENLABS_API_KEY: "***REMOVED***",
        SYNCLABS_API_KEY: "***REMOVED***",
        SYNC_LABS_API_KEY: "***REMOVED***",
        GOOGLE_CLIENT_ID: "***REMOVED***",
        GOOGLE_CLIENT_SECRET: "***REMOVED***",
        GITHUB_CLIENT_ID: "",
        GITHUB_CLIENT_SECRET: "",
        APPLE_CLIENT_ID: "",
        APPLE_CLIENT_SECRET: "",
        STRIPE_SECRET_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
        SESSION_SECRET: "***REMOVED***",
        NEXTAUTH_SECRET: "***REMOVED***",
        NEXTAUTH_URL: "***REMOVED***",
        NEXT_PUBLIC_APP_URL: "***REMOVED***",
        NEXT_PUBLIC_BASE_URL: "***REMOVED***",
        INNGEST_EVENT_KEY: "inngest-dev",
        GEMINI_API_KEY: "***REMOVED***",
      }
    }
  ]
};

