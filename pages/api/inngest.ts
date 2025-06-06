import { serve } from 'inngest/next';
import { Inngest } from 'inngest';
import functions from '../inngest/render-video';

export const inngest = new Inngest({
  name: 'AI Video Ad Generator',
});

export default serve(inngest, functions);
