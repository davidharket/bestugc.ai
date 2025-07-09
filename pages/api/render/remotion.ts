// pages/api/render/remotion.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { renderQueue } from '../../../lib/queue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API /api/render/remotion] Received request.');

  if (req.method !== 'POST') {
    console.log(`[API] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adId, templateId, userId } = req.body;
    console.log(`[API] Request body:`, req.body);

    if (!adId || !templateId || !userId) {
      console.log('[API] Missing required parameters.');
      return res.status(400).json({ error: 'Missing required parameters: adId, templateId, userId' });
    }

    console.log(`[API] Attempting to add job to queue for Ad ID: ${adId}`);
    const job = await renderQueue.add('render-video-job', { adId, templateId, userId });
    console.log(`[API] Job successfully added to queue with ID: ${job.id}`);
    
    res.status(202).json({
      success: true,
      message: 'Render job accepted and queued.',
      jobId: job.id,
    });

  } catch (error) {
    console.error('❌ API error adding job to queue:', error);
    res.status(500).json({
      error: 'Failed to queue render job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

