// pages/api/lipsync/synclabs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const SYNC_LABS_API_URL = 'https://api.sync.so/v2';

if (!SYNC_LABS_API_KEY) {
  throw new Error('SYNC_LABS_API_KEY is not set in your environment variables.');
}

type Data = {
  jobId?: string;
  status?: string;
  lipSyncedVideoUrl?: string;
  error?: string;
  details?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // --- ✅ START: ROBUST SECURITY CHECK ---
  const internalSecret = process.env.INTERNAL_SECRET_KEY;
  if (!internalSecret || req.headers['x-internal-secret'] !== internalSecret) {
    if (process.env.NODE_ENV !== 'development' || req.headers['x-test-secret'] !== process.env.TEST_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  // --- ✅ END: ROBUST SECURITY CHECK ---

  const { method } = req;

  if (method === 'GET') {
    const { jobId } = req.query as { jobId: string };
    if (!jobId) return res.status(400).json({ error: 'Missing jobId parameter' });

    try {
      const response = await axios.get(`${SYNC_LABS_API_URL}/generate/${jobId}`, {
        headers: { 'x-api-key': SYNC_LABS_API_KEY },
        timeout: 20000
      });

      console.log(`[SyncLabs API] Status for job ${jobId}: ${response.data.status}`);
      return res.status(200).json({
        status: response.data.status,
        lipSyncedVideoUrl: response.data.outputUrl, // This will be null if not completed
        error: response.data.error 
      });

    } catch (error: any) {
      console.error(`[SyncLabs API] Error checking job ${jobId}:`, error.response?.data || error.message);
      return res.status(500).json({ error: 'Failed to check job status', details: error.response?.data || error.message });
    }

  } else if (method === 'POST') {
    // ✅ LOGIC CHANGE: The worker now provides the full public URL directly.
    // This API no longer needs to construct it, making it simpler and more reliable.
    const { audioUrl, videoUrl } = req.body;
    if (!audioUrl || !videoUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or videoUrl' });
    }

    try {
      console.log('[SyncLabs API] Sending POST request with public URLs:', { audioUrl, videoUrl });
      
      const response = await axios.post(`${SYNC_LABS_API_URL}/generate`, 
        { 
          model: "lipsync-2", 
          input: [{ type: "video", url: videoUrl }, { type: "audio", url: audioUrl }],
          options: { sync_mode: "bounce" }
        },
        { headers: { 'Content-Type': 'application/json', 'x-api-key': SYNC_LABS_API_KEY } }
      );

      return res.status(201).json({ jobId: response.data.id, status: response.data.status });

    } catch (error: any) {
      console.error('SyncLabs POST error:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Failed to start lip-sync job', details: error.response?.data || error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
