const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');

const prisma = new PrismaClient();

// Create the render queue
const redisConnection = { 
  host: process.env.REDIS_HOST || '127.0.0.1', 
  port: parseInt(process.env.REDIS_PORT || '6379', 10) 
};
const queueName = process.env.RENDER_QUEUE_NAME || 'render-video-production';
const renderQueue = new Queue(queueName, { connection: redisConnection });

async function testAvatarTiming() {
  const adId = 'cmeyf4oie0009149zynmr2uzi'; // The test ad
  
  try {
    console.log('🎯 Starting avatar timing debug test...');
    
    // Reset the ad status
    await prisma.ad.update({
      where: { id: adId },
      data: { 
        status: 'PENDING',
        inngestRunId: null
      }
    });
    
    // Queue the job with debug identifier
    const jobId = `avatar-timing-debug-${Date.now()}`;
    await renderQueue.add('render-video-job', {
      adId: adId,
      templateId: 'edge-showcase'
    }, {
      jobId: jobId
    });
    
    // Update the ad record
    await prisma.ad.update({
      where: { id: adId },
      data: { 
        inngestRunId: jobId
      }
    });
    
    console.log(`✅ Queued avatar timing test: ${jobId}`);
    console.log(`📊 Check render worker logs for [AVATAR TIMING DEBUG] and [CRITICAL AVATAR DEBUG]`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAvatarTiming();
