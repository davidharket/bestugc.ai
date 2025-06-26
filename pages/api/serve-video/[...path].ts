import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path: videoPath } = req.query;
    
    if (!videoPath || !Array.isArray(videoPath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    const filePath = path.join(process.cwd(), 'public', 'renders', ...videoPath);
    
    // Security check - ensure the file is within the renders directory
    const normalizedPath = path.resolve(filePath);
    const rendersDir = path.resolve(path.join(process.cwd(), 'public', 'renders'));
    
    if (!normalizedPath.startsWith(rendersDir)) {
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