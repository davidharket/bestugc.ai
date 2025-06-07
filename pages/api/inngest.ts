import { serve } from 'inngest/next';
import { inngest } from '../../inngest/client';
import functions from '../../inngest/render-video';

// The `serve` function is the main handler for all Inngest functions.
export default serve({
  client: inngest,
  functions,
});
