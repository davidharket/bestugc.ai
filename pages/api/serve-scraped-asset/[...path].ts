// pages/api/serve-scraped-asset/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: filePathParts } = req.query;

  if (!filePathParts || !Array.isArray(filePathParts)) {
    return res.status(400).send('Invalid file path');
  }

  const requestedPath = filePathParts.join('/');
  console.log(`[SERVE ASSET] Received request for: ${requestedPath}`);
  
  // IMPORTANT: Prevent directory traversal attacks
  const safeBasePath = path.resolve(process.cwd(), 'public', 'uploads', 'scraped');
  const absoluteFilePath = path.resolve(safeBasePath, requestedPath);
  console.log(`[SERVE ASSET] Absolute file path: ${absoluteFilePath}`);

  if (!absoluteFilePath.startsWith(safeBasePath)) {
    console.error(`[SERVE ASSET] FORBIDDEN: Attempted directory traversal: ${requestedPath}`);
    return res.status(403).send('Forbidden');
  }

  if (fs.existsSync(absoluteFilePath)) {
    console.log(`[SERVE ASSET] File found. Streaming: ${absoluteFilePath}`);
    const mimeType = mime.lookup(absoluteFilePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(absoluteFilePath);
    fileStream.on('error', (err) => {
      console.error(`[SERVE ASSET] Stream Error:`, err);
      res.status(500).send('Error streaming file');
    });
    fileStream.pipe(res);
  } else {
    console.error(`[SERVE ASSET] NOT FOUND: File does not exist at: ${absoluteFilePath}`);
    res.status(404).send('File not found');
  }
}
