#!/usr/bin/env node

const { Queue } = require('bullmq');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const queueName = process.env.RENDER_QUEUE_NAME || 'render-video-production';

async function checkQueueStatus() {
  console.log(`🔍 Checking queue status for: ${queueName}`);
  console.log(`📡 Redis connection: ${redisConnection.host}:${redisConnection.port}`);
  console.log('─'.repeat(60));

  try {
    const queue = new Queue(queueName, { connection: redisConnection });

    // Get queue counts
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    console.log(`📊 Queue Statistics:`);
    console.log(`   ⏳ Waiting: ${waiting.length}`);
    console.log(`   🔄 Active: ${active.length}`);
    console.log(`   ✅ Completed: ${completed.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log('');

    // Show active jobs
    if (active.length > 0) {
      console.log(`🔄 Currently Processing (${active.length}):`);
      for (const job of active) {
        const { adId, templateId } = job.data;
        console.log(`   Job ${job.id}: Ad ${adId} (Template ${templateId})`);
        console.log(`   Started: ${new Date(job.processedOn || job.timestamp).toLocaleString()}`);
        console.log(`   Progress: ${job.progress || 0}%`);
        console.log('');
      }
    }

    // Show waiting jobs
    if (waiting.length > 0) {
      console.log(`⏳ Queued Jobs (${waiting.length}):`);
      for (const job of waiting.slice(0, 10)) { // Show first 10
        const { adId, templateId } = job.data;
        console.log(`   Job ${job.id}: Ad ${adId} (Template ${templateId})`);
        console.log(`   Added: ${new Date(job.timestamp).toLocaleString()}`);
      }
      if (waiting.length > 10) {
        console.log(`   ... and ${waiting.length - 10} more`);
      }
      console.log('');
    }

    // Show recent failed jobs with user info
    if (failed.length > 0) {
      console.log(`❌ Recent Failed Jobs (${Math.min(failed.length, 5)}):`);
      for (const job of failed.slice(0, 5)) {
        const { adId, templateId } = job.data;
        
        // Get user info from database
        const adWithUser = await prisma.ad.findUnique({
          where: { id: adId },
          select: {
            brandName: true,
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        });
        
        const userInfo = adWithUser?.user ? `${adWithUser.user.name || adWithUser.user.email}` : 'Unknown User';
        const brandName = adWithUser?.brandName || 'Unknown Brand';
        
        console.log(`   Job ${job.id}: Ad ${adId} - ${brandName} (Template ${templateId})`);
        console.log(`   User: ${userInfo}`);
        console.log(`   Failed: ${new Date(job.failedReason?.timestamp || job.timestamp).toLocaleString()}`);
        console.log(`   Error: ${job.failedReason?.message || 'Unknown error'}`);
        console.log('');
      }
    }

    // Check database ad statuses
    console.log('📋 Database Ad Status Summary:');
    const adCounts = await prisma.ad.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { status: 'asc' }
    });

    for (const count of adCounts) {
      const emoji = {
        'PENDING': '⏳',
        'RENDERING': '🔄',
        'COMPLETED': '✅',
        'FAILED': '❌',
        'CANCELLED': '🚫'
      }[count.status] || '❓';
      
      console.log(`   ${emoji} ${count.status}: ${count._count.status} ads`);
    }

    // Show recent ads being processed
    console.log('');
    console.log('🎬 Recent Ads in Progress:');
    const recentAds = await prisma.ad.findMany({
      where: { 
        status: { in: ['RENDERING', 'PENDING'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        brandName: true,
        templateId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    for (const ad of recentAds) {
      const emoji = ad.status === 'RENDERING' ? '🔄' : '⏳';
      const userInfo = ad.user ? `${ad.user.name || ad.user.email}` : 'Unknown User';
      console.log(`   ${emoji} ${ad.id} - ${ad.brandName || 'Unknown Brand'} (Template ${ad.templateId})`);
      console.log(`      User: ${userInfo}, Status: ${ad.status}, Updated: ${ad.updatedAt.toLocaleString()}`);
    }

    if (recentAds.length === 0) {
      console.log('   No ads currently being processed');
    }

    await queue.close();
    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error checking queue status:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the status check
checkQueueStatus();