// pages/api/video/get-duration.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- ✅ START: ROBUST SECURITY CHECK ---
  const internalSecret = process.env.INTERNAL_SECRET_KEY;
  const session = await getServerSession(req, res, authOptions);
  
  // Allow internal secret OR authenticated user session
  const isInternalRequest = internalSecret && req.headers['x-internal-secret'] === internalSecret;
  const isAuthenticatedUser = session?.user?.id;
  const isDevMode = process.env.NODE_ENV === 'development' && req.headers['x-test-secret'] === process.env.TEST_SECRET_KEY;
  
  if (!isInternalRequest && !isAuthenticatedUser && !isDevMode) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // --- ✅ END: ROBUST SECURITY CHECK ---

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filePath } = req.body;
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid filePath' });
  }

  // The filePath from the API call will be relative, e.g., /synclabs/video.mp4
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

    let ffprobeError = '';
    ffprobe.stderr.on('data', (data) => {
        ffprobeError += data.toString();
    });

    await new Promise<void>((resolve, reject) => {
      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffprobe exited with code ${code}. Error: ${ffprobeError}`));
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
