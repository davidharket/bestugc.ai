// pages/api/video/get-duration.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// The "export default" is the critical part that was missing.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filePath } = req.body;
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid filePath' });
  }

  // The filePath from the API call will be relative, e.g., /generated_audio/audio.mp3
  // We need to join it with the project's public directory to get an absolute path.
  const absolutePath = path.join(process.cwd(), 'public', filePath);

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: `File not found at: ${absolutePath}` });
  }

  try {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      absolutePath,
    ]);

    let duration = '';
    ffprobe.stdout.on('data', (data) => {
      duration += data.toString();
    });

    await new Promise<void>((resolve, reject) => {
      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffprobe exited with code ${code}`));
        }
      });
      ffprobe.on('error', reject);
    });

    res.status(200).json({ durationInSeconds: parseFloat(duration.trim()) });

  } catch (error: any) {
    console.error('Failed to get media duration:', error);
    res.status(500).json({ error: 'Failed to get media duration', details: error.message });
  }
}