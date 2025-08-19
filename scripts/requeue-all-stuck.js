// scripts/requeue-all-stuck.js
require('dotenv').config();
const { Queue } = require('bullmq');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Use environment variables for Redis connection, default to localhost
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const queueName = process.env.RENDER_QUEUE_NAME || 'render-video-staging';
const renderQueue = new Queue(queueName, {
  connection: redisConnection,
});

async function requeueAllStuck() {
  try {
    console.log(`🔄 Re-queuing all stuck ads using queue: ${queueName}`);
    
    // Find all ads with QUEUED status
    const queuedAds = await prisma.ad.findMany({
      where: {
        status: 'QUEUED'
      },
      select: {
        id: true,
        brandName: true,
        templateId: true,
        createdAt: true
      }
    });
    
    if (queuedAds.length === 0) {
      console.log('✅ No queued ads found');
      return;
    }
    
    console.log(`📝 Found ${queuedAds.length} queued ads:`);
    queuedAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.id} - ${ad.brandName}`);
    });
    
    // Re-queue each ad
    for (const ad of queuedAds) {
      const job = await renderQueue.add('render-video-staging', {
        adId: ad.id,
        templateId: ad.templateId
      }, {
        delay: 0, // Process immediately
      });
      
      console.log(`✅ Re-queued ${ad.id} as job ${job.id}`);
    }
    
    console.log(`🎉 Successfully re-queued all ${queuedAds.length} ads!`);
    
    // Close connections
    await renderQueue.close();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error re-queuing ads:', error);
    await renderQueue.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

requeueAllStuck();
