// pages/api/render/serve-video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check for internal secret in either headers or query parameter
    const internalSecret = req.headers['x-internal-secret'] || req.query.internal_secret;
    if (!internalSecret || internalSecret !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized - Internal access only' });
    }

    const { videoPath } = req.query;
    
    if (!videoPath || typeof videoPath !== 'string') {
      return res.status(400).json({ error: 'Invalid video path' });
    }

    // Determine the full file path based on the video path
    let filePath: string;
    let allowedDir: string;
    
    if (videoPath.startsWith('/api/serve-video/')) {
      // Extract the actual path from the serve-video URL
      const actualPath = videoPath.replace('/api/serve-video/', '');
      
      if (actualPath.startsWith('generated_videos/')) {
        filePath = path.join(process.cwd(), 'public', actualPath);
        allowedDir = path.resolve(path.join(process.cwd(), 'public', 'generated_videos'));
      } else if (actualPath.startsWith('synclabs/')) {
        filePath = path.join(process.cwd(), 'public', actualPath);
        allowedDir = path.resolve(path.join(process.cwd(), 'public', 'synclabs'));
      } else {
        filePath = path.join(process.cwd(), 'public', 'renders', actualPath);
        allowedDir = path.resolve(path.join(process.cwd(), 'public', 'renders'));
      }
    } else {
      return res.status(400).json({ error: 'Invalid video path format' });
    }
    
    // Security check - ensure the file is within the allowed directory
    const normalizedPath = path.resolve(filePath);
    
    if (!normalizedPath.startsWith(allowedDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Get file stats
    const stat = fs.statSync(normalizedPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Set appropriate headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    
    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const file = fs.createReadStream(normalizedPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      });
      
      file.pipe(res);
    } else {
      // Send the entire file
      res.setHeader('Content-Length', fileSize);
      const file = fs.createReadStream(normalizedPath);
      file.pipe(res);
    }
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}