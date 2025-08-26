#!/bin/bash
# scripts/quick-restart.sh - Quick restart with minimal downtime (for urgent fixes)

set -e

echo "⚡ Starting quick restart (minimal downtime)..."

# Configuration
APP_NAME="ageco-ai"
WORKER_NAME="render-worker"
HEALTH_URL="***REMOVED***/api/health"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

# Check if build is needed
if [ "$1" == "--with-build" ]; then
    log "Building application..."
    npm run build
    success "Build completed"
fi

# Quick restart (some downtime but faster)
log "Performing quick restart..."
pm2 restart $APP_NAME $WORKER_NAME

# Brief wait
sleep 3

# Quick health check
log "Performing health check..."
for i in {1..10}; do
    if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
        success "Health check passed!"
        break
    else
        if [ $i -eq 10 ]; then
            warning "Health check failed, but continuing..."
        else
            sleep 1
        fi
    fi
done

pm2 status
success "Quick restart completed!"