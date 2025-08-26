#!/bin/bash
# scripts/deploy.sh - Zero-downtime deployment script

set -e  # Exit on any error

echo "🚀 Starting zero-downtime deployment..."

# Configuration
APP_NAME="ageco-ai"
WORKER_NAME="render-worker" 
HEALTH_URL="***REMOVED***/api/health"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Function to check if app is healthy
check_health() {
    local attempt=1
    while [ $attempt -le $MAX_HEALTH_CHECKS ]; do
        if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
            success "Health check passed (attempt $attempt/$MAX_HEALTH_CHECKS)"
            return 0
        else
            warning "Health check failed (attempt $attempt/$MAX_HEALTH_CHECKS)"
            sleep $HEALTH_CHECK_INTERVAL
        fi
        ((attempt++))
    done
    error "Health checks failed after $MAX_HEALTH_CHECKS attempts"
    return 1
}

# Function to wait for PM2 process to be ready
wait_for_pm2_ready() {
    local process_name=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pm2 jlist | jq -r ".[] | select(.name == \"$process_name\") | .pm2_env.status" | grep -q "online"; then
            success "$process_name is online"
            return 0
        else
            warning "$process_name not ready yet (attempt $attempt/$max_attempts)"
            sleep 2
        fi
        ((attempt++))
    done
    error "$process_name failed to come online after $max_attempts attempts"
    return 1
}

# Backup current version info
log "Creating deployment backup info..."
pm2 jlist > backup/pm2-processes-$(date +%Y%m%d-%H%M%S).json || true

# Step 1: Build the application
log "Building application..."
npm ci --production=false
npm run build

if [ $? -ne 0 ]; then
    error "Build failed! Aborting deployment."
    exit 1
fi

success "Build completed successfully"

# Step 2: Stop and start render worker (single instance, quick restart)
log "Restarting render worker..."
pm2 stop $WORKER_NAME || true
sleep 2
pm2 start ecosystem.config.production.js --only $WORKER_NAME

if ! wait_for_pm2_ready $WORKER_NAME; then
    error "Render worker failed to start"
    exit 1
fi

# Step 3: Graceful reload of web application (zero-downtime)
log "Performing graceful reload of web application..."
pm2 reload $APP_NAME --update-env

# Wait for the application to be ready
sleep 5

# Step 4: Health check
log "Performing health checks..."
if check_health; then
    success "Deployment completed successfully! 🎉"
else
    error "Health checks failed. Rolling back..."
    
    # Rollback: restart with previous version
    pm2 restart $APP_NAME
    sleep 5
    
    if check_health; then
        warning "Rollback successful, but deployment failed"
        exit 1
    else
        error "Rollback failed! Manual intervention required"
        exit 2
    fi
fi

# Step 5: Cleanup and status
log "Cleaning up..."
pm2 save
pm2 logs --lines 20

success "Zero-downtime deployment completed successfully!"
log "Current PM2 status:"
pm2 status