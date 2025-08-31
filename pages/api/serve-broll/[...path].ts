import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: filePath } = req.query;
  
  if (!filePath || !Array.isArray(filePath)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Join the path segments
  const fileName = filePath.join('/');
  
  // Security: Prevent directory traversal attacks
  if (fileName.includes('..') || fileName.includes('\\')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Construct the full path to the B-roll file
  const fullPath = path.join(process.cwd(), 'public', 'b-roll', fileName);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'B-roll file not found' });
  }

  try {
    // Get file stats
    const stats = fs.statSync(fullPath);
    
    // Set appropriate headers for video files
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Handle range requests for video streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
      res.setHeader('Content-Length', chunksize);
      
      const stream = fs.createReadStream(fullPath, { start, end });
      stream.pipe(res);
    } else {
      // Serve the entire file
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error serving B-roll file:', error);
    return res.status(500).json({ error: 'Failed to serve B-roll file' });
  }
}