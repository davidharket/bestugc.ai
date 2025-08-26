# Deployment Guide

## Current Working Method ✅

The application is currently working correctly. You successfully deployed using:

```bash
npm run build && pm2 restart ageco-ai
```

However, this method sometimes causes build manifest mismatches.

## Recommended Deployment Scripts

### 1. **Quick Deploy (Most Similar to Your Working Method)**
```bash
# Simple but effective
npm run build && pm2 delete ageco-ai; pm2 start ecosystem.config.js --only ageco-ai
```

### 2. **Safe Deploy Script**
```bash
./deploy-safe.sh
```
- Verifies build success
- Completely refreshes PM2 process 
- Includes health checks
- **Recommended for production**

### 3. **Zero-Downtime Deploy**
```bash
./deploy-zero-downtime.sh
```
- Uses `pm2 reload` for minimal downtime
- Fallback to restart if needed
- Good for busy periods

## Current Application Status
- ✅ `ageco-ai` - Main application running (Port 3000)
- ✅ `render-worker` - Background video processing
- ✅ Health endpoint: ***REMOVED***/api/health

## Key Files
- `ecosystem.config.js` - PM2 configuration (correct one to use)
- `ecosystem.config.production.js` - Advanced config (avoid for now)

## Troubleshooting
If you see build manifest errors (`wpEjuVjVG0feMeDmf2QV0` type errors):
1. Use `./deploy-safe.sh` 
2. Or run: `pm2 delete ageco-ai && pm2 start ecosystem.config.js --only ageco-ai`

## What Fixed Your Recent Issues
1. **Build completed successfully** - All static files generated
2. **Used correct ecosystem.config.js** - Simple, reliable configuration  
3. **Complete PM2 restart** - Cleared old cached processes
4. **Health check passed** - Application responding correctly

Your site is now fully functional at: https://bestugc.ai