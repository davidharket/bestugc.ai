import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const SYNC_LABS_API_URL = 'https://api.sync.so/v2';

if (!SYNC_LABS_API_KEY) {
  throw new Error('SYNC_LABS_API_KEY is not set in your environment variables.');
}

type Data = {
  // Success states
  jobId?: string;
  status?: string;
  lipSyncedVideoUrl?: string;
  // Error state
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { method } = req;
  console.log(`🔄 SyncLabs API called: ${method} ${req.url}`);

  if (method === 'GET') {
    const { jobId } = req.query as { jobId: string };
    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId parameter' });
    }

    try {
      console.log(`🔍 Checking status for SyncLabs job: ${jobId}`);
      const response = await axios.get(`${SYNC_LABS_API_URL}/generate/${jobId}`, {
        headers: { 'x-api-key': SYNC_LABS_API_KEY },
        timeout: 15000
      });

      console.log(`📊 SyncLabs response status: ${response.data.status}`);
      if (response.data.status === 'COMPLETED') {
        return res.status(200).json({
          status: response.data.status,
          lipSyncedVideoUrl: response.data.outputUrl,
        });
      } else {
        return res.status(200).json({ 
          status: response.data.status, 
          error: response.data.error 
        });
      }
    } catch (error: any) {
      console.error(`❌ Error checking SyncLabs job ${jobId}:`, error.response?.data || error.message);
      return res.status(500).json({ 
        error: 'Failed to check job status',
        details: error.response?.data || error.message
      });
    }

  } else if (method === 'POST') {
    const { audioUrl, videoUrl } = req.body;
    if (!audioUrl || !videoUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or videoUrl' });
    }

    try {
      // ✅ THE FIX: Use the public base URL for external API calls.
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_BASE_URL is not set. This is required for external APIs to access your local files via ngrok.");
      }

      // Construct absolute URLs that are publicly accessible via your tunnel.
      const absoluteAudioUrl = audioUrl.startsWith('/') ? `${baseUrl}${audioUrl}` : audioUrl;
      const absoluteVideoUrl = videoUrl.startsWith('/') ? `${baseUrl}${videoUrl}` : videoUrl;
      
      console.log('Sending PUBLIC request to SyncLabs with:', {
        audioUrl: absoluteAudioUrl,
        videoUrl: absoluteVideoUrl
      });
      
      // The API call to SyncLabs
      const response = await axios.post(`${SYNC_LABS_API_URL}/generate`, {
        model: "lipsync-2",
        input: [
          { type: "video", url: absoluteVideoUrl },
          { type: "audio", url: absoluteAudioUrl }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SYNC_LABS_API_KEY,
        },
      });

      return res.status(201).json({ jobId: response.data.id, status: response.data.status });

    } catch (error: any) {
      console.error('SyncLabs POST error:', error.response?.data || error.message);
      return res.status(500).json({ 
        error: 'Failed to start lip-sync job', 
        details: error.response?.data || error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}