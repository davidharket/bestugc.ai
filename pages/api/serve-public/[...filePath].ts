// pages/api/serve-public/[...filePath].ts

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Extract the file path from the URL, like "cutouts/video.webm"
  const { filePath } = req.query;
  if (!filePath || !Array.isArray(filePath)) {
    return res.status(400).send('Invalid file path');
  }
  const requestedPath = filePath.join('/');

  // 2. Construct the full, secure path to the file on the server's disk
  const publicDir = path.join(process.cwd(), 'public');
  const fileFullPath = path.resolve(path.join(publicDir, requestedPath));

  // 3. Security Check: This is critical. It prevents users from accessing
  // files outside of your designated /public directory.
  if (!fileFullPath.startsWith(publicDir)) {
    return res.status(403).send('Forbidden: Access denied.');
  }

  // 4. Check if the file exists and stream it back to the user
  try {
    if (fs.existsSync(fileFullPath)) {
      const mimeType = mime.lookup(fileFullPath) || 'application/octet-stream';
      const stats = fs.statSync(fileFullPath);

      // Set basic headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      res.setHeader('Accept-Ranges', 'bytes');

      // Handle range requests for video streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206); // Partial Content
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Content-Length', chunksize);
        
        const stream = fs.createReadStream(fileFullPath, { start, end });
        stream.pipe(res);
      } else {
        // Serve the entire file
        res.setHeader('Content-Length', stats.size);
        const fileStream = fs.createReadStream(fileFullPath);
        fileStream.pipe(res);
      }
    } else {
      res.status(404).send('File not found at specified path.');
    }
  } catch (error) {
    console.error(`[Serve Public API] Error serving file: ${fileFullPath}`, error);
    res.status(500).send('Internal Server Error');
  }
}
