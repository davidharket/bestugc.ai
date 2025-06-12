import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const SYNC_LABS_API_URL = 'https://api.sync.so/v2'; // Correct base URL

if (!SYNC_LABS_API_KEY) {
  throw new Error('SYNC_LABS_API_KEY is not set');
}

type Data = {
  // Success states
  jobId?: string;
  status?: string;
  lipSyncedVideoUrl?: string; // Kept for polling response
  // Error state
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    const { jobId } = req.query;
    // This part is for polling the job status
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid jobId for status check' });
    }

    try {
      const response = await axios.get(`${SYNC_LABS_API_URL}/generate/${jobId}`, {
        headers: { 'x-api-key': SYNC_LABS_API_KEY },
      });

      if (response.data.status === 'COMPLETED') {
        return res.status(200).json({
          status: response.data.status,
          lipSyncedVideoUrl: response.data.outputUrl,
        });
      } else {
        return res.status(200).json({ status: response.data.status, error: response.data.error });
      }
    } catch (error: any) {
      console.error('SyncLabs GET error:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Failed to get lip-sync job status' });
    }

  } else if (req.method === 'POST') {
    const { audioUrl, videoUrl } = req.body;
    // This part starts the job
    if (!audioUrl || !videoUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or videoUrl' });
    }

    try {
      // Ensure the URLs are absolute
      const absoluteAudioUrl = audioUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL}${audioUrl}` : audioUrl;
      const absoluteVideoUrl = videoUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL}${videoUrl}` : videoUrl;
      
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
      return res.status(500).json({ error: 'Failed to start lip-sync job' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 