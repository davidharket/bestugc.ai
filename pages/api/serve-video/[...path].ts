import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Always check authentication for video access
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if this is a download request (has download parameter or Content-Disposition header)
    const isDownloadRequest = req.query.download !== undefined || 
                             req.headers['sec-fetch-dest'] === 'document' ||
                             req.headers['accept']?.includes('text/html');
    
    // For free users, allow streaming but block downloads
    if (session.user.plan === 'FREE') {
      if (isDownloadRequest) {
        return res.status(403).json({ 
          error: 'Upgrade required', 
          message: 'Video downloads are available for paid plan subscribers only. Your existing videos will not count against your new credits when you upgrade!' 
        });
      }
      
      // Add headers to prevent caching and make it harder to save
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    const { path: videoPath } = req.query;
    
    if (!videoPath || !Array.isArray(videoPath)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    // Determine if this is a SyncLabs video or a rendered video
    const isSyncLabs = videoPath[0] === 'synclabs' || videoPath.join('/').includes('synclabs');
    
    let filePath: string;
    let allowedDir: string;
    
    if (isSyncLabs) {
      // SyncLabs videos are stored in public/synclabs/
      filePath = path.join(process.cwd(), 'public', 'synclabs', ...videoPath.slice(1));
      allowedDir = path.resolve(path.join(process.cwd(), 'public', 'synclabs'));
    } else {
      // Rendered videos are stored in public/renders/
      filePath = path.join(process.cwd(), 'public', 'renders', ...videoPath);
      allowedDir = path.resolve(path.join(process.cwd(), 'public', 'renders'));
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
    
    // If this is a download request, set Content-Disposition header
    if (isDownloadRequest) {
      const filename = path.basename(normalizedPath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
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