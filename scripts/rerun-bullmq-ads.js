// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');

// --- Configuration ---
// These settings are taken directly from your `workers/render-worker.ts` file
const prisma = new PrismaClient();
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10)
};
const queueName = process.env.RENDER_QUEUE_NAME || 'render-video-staging';

// Connect to the same queue your worker listens to
const renderQueue = new Queue(queueName, { connection: redisConnection });

async function rerunSpecificAds() {
  const adIds = process.argv.slice(2);

  if (adIds.length === 0) {
    console.log('Please provide at least one Ad ID to re-run.');
    console.log('Usage: node scripts/rerun-bullmq-ads.js <adId1> <adId2> ...');
    return;
  }

  console.log(`Connecting to queue "${queueName}"...`);
  console.log(`Attempting to re-run ${adIds.length} ad(s)...`);

  for (const adId of adIds) {
    try {
      // 1. Fetch the ad from the database to get its details
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
      });

      if (!ad) {
        console.warn(`- Ad with ID: ${adId} not found. Skipping.`);
        continue;
      }

      // The worker requires both adId and templateId. Ensure templateId exists.
      if (!ad.templateId) {
        console.error(`- ❌ Ad ${adId} is missing a templateId and cannot be requeued. Skipping.`);
        continue;
      }

      console.log(`- Found ad: ${adId} with template: ${ad.templateId}. Resetting status...`);

      // 2. Reset the ad's status and clear old data for a clean run
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: 'PENDING',
          finalVideoUrl: null,
          finalVideoUrl4x5: null,
          syncLabsJobId: null,
          lipsyncedAvatarUrl: null,
          lipsyncedAvatarNoBgUrl: null,
        },
      });
      console.log(`- Status for ad ${adId} reset to PENDING.`);

      // 3. Add the job to the BullMQ queue
      //    The job data { adId, templateId } MUST match what the worker expects
      await renderQueue.add('render-ad-manually-requeued', {
        adId: ad.id,
        templateId: ad.templateId,
      });

      console.log(`- ✅ Successfully added job for ad ${adId} to the "${queueName}" queue.`);

    } catch (error) {
      console.error(`- ❌ Error re-running ad with ID ${adId}:`, error.message);
    }
  }

  // Close connections so the script can exit
  await renderQueue.close();
  await prisma.$disconnect();
}

rerunSpecificAds().catch(e => {
  console.error(e);
  process.exit(1);
});
