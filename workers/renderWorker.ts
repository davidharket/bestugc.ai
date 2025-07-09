
// workers/renderWorker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { performRender } from '../lib/render-video-core';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

console.log('[render-worker] Starting up...');

new Worker(
  'render-video',
  async (job) => {
    console.log(`[render-worker] Processing job ${job.id}`);
    try {
      const result = await performRender(job.data);
      console.log(`[render-worker] Job ${job.id} completed successfully.`);
      return result;
    } catch (error) {
      console.error(`[render-worker] Job ${job.id} failed:`, error);
      throw error; // Re-throw the error to let BullMQ handle the failure
    }
  },
  {
    connection,
    concurrency: 1, // Process one job at a time
    limiter: {
      max: 1,
      duration: 5000, // Allow 1 job every 5 seconds
    },
  }
);

console.log('[render-worker] Worker is listening for jobs on the "render-video" queue.');
