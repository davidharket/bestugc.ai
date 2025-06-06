import { inngest } from '../pages/api/inngest';

export const renderVideoJob = inngest.createFunction(
  { id: 'render-video-job' },
  { event: 'ad/render.requested' },
  async ({ event, step }) => {
    const { adId, adData } = event.data;
    console.log('Received render job for', adId, adData);
    // TODO: implement steps
  }
);

export default [renderVideoJob];
