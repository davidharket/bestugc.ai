// pages/api/video/get-framerate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';
import path from 'path';

interface FramerateResponse {
  framerate: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FramerateResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    // Construct the full path to the video file
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(fullPath)) {
      console.error(`[GET-FRAMERATE] File not found: ${fullPath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Use ffprobe to get the framerate
    const framerateOutput = execSync(
      `ffprobe -v quiet -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "${fullPath}"`,
      { encoding: 'utf8' }
    ).trim();

    // Parse the framerate (e.g., "25/1" -> 25, "30000/1001" -> ~29.97)
    const [numerator, denominator = '1'] = framerateOutput.split('/');
    const framerate = Math.round(parseFloat(numerator) / parseFloat(denominator));

    console.log(`[GET-FRAMERATE] File: ${filePath}, Raw: ${framerateOutput}, Parsed: ${framerate} FPS`);

    res.status(200).json({ framerate });
  } catch (error: any) {
    console.error('[GET-FRAMERATE] Error:', error.message);
    res.status(500).json({ error: 'Failed to get video framerate' });
  }
}