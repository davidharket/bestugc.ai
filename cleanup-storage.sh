#!/bin/bash

# Storage cleanup script for ageco.ai
echo "=== AGECO.AI Storage Cleanup ==="
echo "Starting cleanup at $(date)"

# Function to show size before and after
show_size() {
    local dir=$1
    local name=$2
    echo "$name: $(du -sh $dir 2>/dev/null | cut -f1 || echo '0B')"
}

echo ""
echo "Current storage usage:"
show_size "/var/www/ageco.ai/public/previews" "Previews"
show_size "/var/www/ageco.ai/public/uploads/scraped" "Scraped files"
show_size "/var/www/ageco.ai/public/uploads/temp" "Temp files"

echo ""
echo "=== Cleaning up old files ==="

# Clean preview files older than 1 day (they're regenerated on demand)
echo "Removing preview files older than 1 day..."
find /var/www/ageco.ai/public/previews -type f -mtime +1 -delete
echo "Preview cleanup complete"

# Clean scraped files older than 7 days
echo "Removing scraped files older than 7 days..."
find /var/www/ageco.ai/public/uploads/scraped -type f -mtime +7 -delete
echo "Scraped files cleanup complete"

# Clean temp files older than 1 day
echo "Removing temp files older than 1 day..."
find /var/www/ageco.ai/public/uploads/temp -type f -mtime +1 -delete
echo "Temp files cleanup complete"

# Clean empty directories
echo "Removing empty directories..."
find /var/www/ageco.ai/public/uploads/scraped -type d -empty -delete 2>/dev/null
find /var/www/ageco.ai/public/previews -type d -empty -delete 2>/dev/null
find /var/www/ageco.ai/public/uploads/temp -type d -empty -delete 2>/dev/null

echo ""
echo "Storage usage after cleanup:"
show_size "/var/www/ageco.ai/public/previews" "Previews"
show_size "/var/www/ageco.ai/public/uploads/scraped" "Scraped files"
show_size "/var/www/ageco.ai/public/uploads/temp" "Temp files"

echo ""
echo "Overall project size:"
show_size "/var/www/ageco.ai/public" "Public directory"
show_size "/var/www/ageco.ai" "Total project"

echo "Cleanup completed at $(date)"