// lib/queue.ts
import { Queue } from 'bullmq';

// Use environment variables for Redis connection, default to localhost
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Define a single queue for rendering videos.
// We export this so it can be used by both the API route and the worker.
export const renderQueue = new Queue('render-video', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry a job up to 3 times if it fails
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s before the first retry, then 10s, 20s, etc.
    },
    removeOnComplete: true, // Keep job logs for 1 hour after completion
    removeOnFail: false, // Keep failed jobs forever until manually removed
  },
});

console.log('[Queue] BullMQ renderQueue initialized.');
