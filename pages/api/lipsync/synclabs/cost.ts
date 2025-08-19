import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const SYNC_LABS_API_URL = 'https://api.sync.so/v2';

if (!SYNC_LABS_API_KEY) {
  throw new Error('SYNC_LABS_API_KEY is not set');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { audioUrl, videoUrl } = req.body;

  if (!audioUrl || !videoUrl) {
    return res.status(400).json({ error: 'Missing audioUrl or videoUrl' });
  }

  try {
    const absoluteAudioUrl = audioUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL}${audioUrl}` : audioUrl;
    const absoluteVideoUrl = videoUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL}${videoUrl}` : videoUrl;

    const response = await axios.post(`${SYNC_LABS_API_URL}/analyze/cost`, {
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

    console.log('SyncLabs Cost API Raw Response:', response.data);

    // The cost API might return a single object or an array
    const responseData = Array.isArray(response.data) ? response.data : [response.data];
    const totalCost = responseData.reduce((sum: number, item: any) => sum + (item.estimatedGenerationCost || 0), 0);

    res.status(200).json({ estimatedCost: totalCost });
  } catch (error: any) {
    console.error('SyncLabs Cost API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to estimate SyncLabs cost' });
  }
} 