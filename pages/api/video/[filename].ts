// pages/api/video/[filename].ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;
  
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // Only allow specific video files for security
  const allowedFiles = [
    'hero1.mp4', 'hero2.mp4', 'hero3.mp4',
    'v1.mp4', 'v2.mp4', 'v3.mp4', 'v4.mp4', 'v5.mp4'
  ];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const videoPath = path.join(process.cwd(), 'public', filename);
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set video-specific headers
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate'); // Disable caching for now
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');

  if (range) {
    // Handle range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    
    res.status(206); // Partial Content
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);
    
    const file = fs.createReadStream(videoPath, { start, end });
    file.pipe(res);
  } else {
    // Serve entire file
    res.setHeader('Content-Length', fileSize);
    const file = fs.createReadStream(videoPath);
    file.pipe(res);
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};