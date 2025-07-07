// pages/api/inngest.ts
import { serve } from 'inngest/next';
import { inngest } from '../../inngest/client';

// ✅ THE FIX: We explicitly import the job function here.
// This tells the main Next.js application to be aware of the background job
// and to execute it when it receives an event.
import { renderVideoJob } from '../../inngest/render-video';

// The `serve` function is the main handler. By passing our functions in an array,
// the main app itself becomes the worker.
export default serve({
  client: inngest,
  functions: [
    renderVideoJob, // Register the function to be served
  ],
});
