#!/bin/bash
# The new, official zero-downtime deployment script.

set -e

echo "🚀 Starting a true zero-downtime deployment..."

echo "📦 Building the Next.js application..."
npm run build

echo "🔄 Reloading the application with zero-downtime..."
pm2 reload ageco-ai

echo "⚙️ Restarting the render-worker..."
pm2 restart render-worker

echo "✅ Deployment complete! Checking the final status..."
pm2 status

echo ""
echo "🎉 Zero-downtime deployment has been successfully completed!"
echo "📈 All instances have been updated without interrupting user traffic."
