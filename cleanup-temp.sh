#!/bin/bash
# Clean up temporary Remotion files older than 1 hour
find /tmp -name "remotion-webpack-bundle-*" -type d -mmin +60 -exec rm -rf {} \; 2>/dev/null || true
find /tmp -name "react-motion-render*" -type d -mmin +60 -exec rm -rf {} \; 2>/dev/null || true

# Log cleanup
echo "$(date): Cleaned up temporary files" >> /var/www/ageco.ai/cleanup.log