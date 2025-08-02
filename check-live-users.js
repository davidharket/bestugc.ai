#!/usr/bin/env node

/**
 * Live User Monitor Script
 * 
 * This script checks for live users on your website by analyzing recent visitor activity.
 * It uses your existing VisitorStats table to determine if users are currently active.
 * 
 * Usage:
 *   node check-live-users.js
 *   node check-live-users.js --threshold 5  # Check for users active in last 5 minutes
 *   node check-live-users.js --detailed     # Show detailed user information
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const DEFAULT_ACTIVE_THRESHOLD_MINUTES = 3; // Consider user active if visited within last 3 minutes
const WARNING_THRESHOLD = 5; // Warn if more than 5 active users

// Parse command line arguments
const args = process.argv.slice(2);
const thresholdArg = args.find(arg => arg.startsWith('--threshold'));
const activeThresholdMinutes = thresholdArg 
  ? parseInt(thresholdArg.split('=')[1]) || DEFAULT_ACTIVE_THRESHOLD_MINUTES
  : DEFAULT_ACTIVE_THRESHOLD_MINUTES;

const showDetailed = args.includes('--detailed') || args.includes('-d');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
Live User Monitor - Check for active users before deploying updates

Usage:
  node check-live-users.js [options]

Options:
  --threshold=N     Consider users active if they visited within N minutes (default: ${DEFAULT_ACTIVE_THRESHOLD_MINUTES})
  --detailed, -d    Show detailed information about active users
  --help, -h        Show this help message

Examples:
  node check-live-users.js                    # Quick check with default settings
  node check-live-users.js --threshold=5 -d   # Detailed check for 5-minute window
  
Exit codes:
  0 - Safe to deploy (no active users or very few)
  1 - Warning: Some active users detected
  2 - High activity: Many users active, avoid deployment
  3 - Error occurred
`);
  process.exit(0);
}

async function checkLiveUsers() {
  try {
    console.log(`🔍 Checking for users active within the last ${activeThresholdMinutes} minutes...\n`);
    
    const thresholdTime = new Date(Date.now() - activeThresholdMinutes * 60 * 1000);
    
    // Check for active NextAuth sessions (valid, non-expired sessions)
    const activeSessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: new Date() // Session hasn't expired
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Check for recent ad creation activity (users actively creating content)
    const recentAdActivity = await prisma.ad.findMany({
      where: {
        updatedAt: {
          gte: thresholdTime
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Get unique users from both sources
    const sessionUserIds = new Set(activeSessions.map(s => s.userId));
    const activeAdUserIds = new Set(recentAdActivity.map(ad => ad.userId));
    const allActiveUserIds = new Set([...sessionUserIds, ...activeAdUserIds]);

    // Display results
    const sessionCount = activeSessions.length;
    const recentActivityCount = recentAdActivity.length;
    const uniqueActiveUsers = allActiveUserIds.size;
    
    console.log(`📊 Live User Analysis:`);
    console.log(`   Active sessions: ${sessionCount}`);
    console.log(`   Unique active users: ${uniqueActiveUsers}`);
    console.log(`   Recent ad activity: ${recentActivityCount} updates`);
    console.log(`   Time window: ${activeThresholdMinutes} minutes`);
    console.log(`   Timestamp: ${new Date().toISOString()}\n`);

    // Show detailed information if requested
    if (showDetailed) {
      if (activeSessions.length > 0) {
        console.log(`🔍 Active Sessions:`);
        activeSessions.forEach(session => {
          const expiresIn = Math.round((new Date(session.expires).getTime() - Date.now()) / (60 * 1000));
          const userName = session.user?.name || session.user?.email || 'Unknown';
          console.log(`   • ${userName} - expires in ${expiresIn}m`);
        });
        console.log();
      }

      if (recentAdActivity.length > 0) {
        console.log(`🔍 Recent Ad Activity (last ${recentAdActivity.length} updates):`);
        recentAdActivity.forEach(ad => {
          const timeAgo = Math.round((Date.now() - new Date(ad.updatedAt).getTime()) / 60000);
          const userName = ad.user?.name || ad.user?.email || 'Unknown';
          const status = ad.status || 'UNKNOWN';
          console.log(`   • ${userName}: ${ad.brandName || 'Unnamed ad'} (${status}) - ${timeAgo}m ago`);
        });
        console.log();
      }
    }

    // Determine deployment safety
    let exitCode = 0;
    let recommendation = '';
    let emoji = '';

    // Use the higher of session count or unique active users for safety assessment
    const activityScore = Math.max(sessionCount, uniqueActiveUsers);

    if (activityScore === 0) {
      emoji = '✅';
      recommendation = 'SAFE TO DEPLOY - No active users detected';
      exitCode = 0;
    } else if (activityScore <= 2) {
      emoji = '⚠️';
      recommendation = 'PROCEED WITH CAUTION - Few active users detected';
      exitCode = 1;
    } else if (activityScore <= WARNING_THRESHOLD) {
      emoji = '⚠️';
      recommendation = 'WARNING - Several active users detected. Consider waiting.';
      exitCode = 1;
    } else {
      emoji = '🚨';
      recommendation = 'HIGH ACTIVITY - Many users active. Avoid deployment!';
      exitCode = 2;
    }

    console.log(`${emoji} ${recommendation}\n`);

    if (activityScore > 0) {
      console.log(`💡 Tips:`);
      console.log(`   • Wait for activity to decrease before deploying`);
      console.log(`   • Check again in a few minutes: node check-live-users.js`);
      console.log(`   • Use --detailed flag for more information about active users`);
      if (activeThresholdMinutes < 5) {
        console.log(`   • Try a longer threshold: node check-live-users.js --threshold=5`);
      }
    }

    return exitCode;

  } catch (error) {
    console.error('❌ Error checking live users:', error.message);
    return 3;
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the check
checkLiveUsers()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(3);
  });