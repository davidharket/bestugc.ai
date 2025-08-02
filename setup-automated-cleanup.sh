#!/bin/bash

# Setup automated cleanup cron job
echo "Setting up automated cleanup cron job..."

# Add cron job to run cleanup daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/ageco.ai/cleanup-storage.sh >> /var/log/ageco-cleanup.log 2>&1") | crontab -

echo "✅ Automated cleanup scheduled for 2 AM daily"
echo "✅ Logs will be saved to /var/log/ageco-cleanup.log"

# Show current cron jobs
echo ""
echo "Current cron jobs:"
crontab -l