// pages/api/video/extract-audio.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';

const ensureTmpDir = () => {
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
}

const downloadFile = async (url: string, outputPath: string): Promise<void> => {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (
    process.env.NODE_ENV === 'development' &&
    req.headers['x-test-secret'] !== process.env.TEST_SECRET_KEY
  ) {
    return res.status(401).json({ error: 'Unauthorized: Invalid test secret' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ THE FIX: Accept either a URL or a local file path
  const { videoUrl, localVideoPath } = req.body;
  if (!videoUrl && !localVideoPath) {
    return res.status(400).json({ error: 'Either videoUrl or localVideoPath is required.' });
  }
  
  ensureTmpDir();
  const sourceIdentifier = localVideoPath || videoUrl;
  let videoToProcessPath = '';
  let shouldCleanup = false;

  const outputFilename = `audio-${crypto.createHash('md5').update(sourceIdentifier).digest('hex').slice(0, 8)}.mp3`;
  const outputPath = path.join(process.cwd(), 'public', 'generated_audio', outputFilename);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  try {
    if (localVideoPath) {
      if (!fs.existsSync(localVideoPath)) {
        return res.status(400).json({ error: `Local file not found at: ${localVideoPath}` });
      }
      videoToProcessPath = localVideoPath;
    } else {
      videoToProcessPath = path.join('/tmp', `temp-audio-in-${crypto.randomBytes(6).toString('hex')}.mp4`);
      await downloadFile(videoUrl, videoToProcessPath);
      shouldCleanup = true;
    }

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-i', videoToProcessPath, '-q:a', '0', '-map', 'a', outputPath, '-y']);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
      ffmpeg.on('error', reject);
    });

    res.status(200).json({ audioUrl: `/generated_audio/${outputFilename}` });

  } catch (error: any) {
    console.error('Audio extraction failed:', error);
    res.status(500).json({ error: 'Failed to extract audio', details: error.message });
  } finally {
    if (shouldCleanup && fs.existsSync(videoToProcessPath)) {
        try { fs.unlinkSync(videoToProcessPath); } catch (e) { console.error("Failed to delete temp video file:", e); }
    }
  }
}