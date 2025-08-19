// pages/api/serve-fonts/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path: requestPath } = req.query;
    
    if (!requestPath || !Array.isArray(requestPath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    // Join the path segments
    const fontPath = requestPath.join('/');
    
    // Security: Only allow fonts from the custom directory
    if (!fontPath.startsWith('custom/')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'public', 'fonts', fontPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Font file not found' });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);
    const fileExtension = path.extname(fullPath).toLowerCase();
    
    // Set appropriate content type based on file extension
    let contentType = 'application/octet-stream';
    switch (fileExtension) {
      case '.woff':
        contentType = 'font/woff';
        break;
      case '.woff2':
        contentType = 'font/woff2';
        break;
      case '.ttf':
        contentType = 'font/ttf';
        break;
      case '.otf':
        contentType = 'font/otf';
        break;
    }
    
    // Set appropriate headers for font files
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests for fonts
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Send the file
    res.status(200).send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving font file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}