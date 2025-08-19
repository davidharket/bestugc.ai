// pages/api/music/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

export interface CustomMusic {
  id: string;
  name: string;
  url: string;
  originalFilename: string;
  uploadedAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For now, we'll list all uploaded music files
    // In a production environment, you might want to track uploads per user in a database
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'music');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({ music: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    const musicFiles: CustomMusic[] = [];

    for (const filename of files) {
      if (filename.startsWith('music_') && !filename.startsWith('.')) {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        // Extract the ID from the filename (format: music_{id}.ext)
        const match = filename.match(/^music_([^.]+)/);
        const id = match ? match[1] : filename;
        
        // Create display name from filename
        const displayName = filename
          .replace(/^music_[^_]*_?/, '') // Remove music_ prefix and ID
          .replace(/\.[^/.]+$/, '')      // Remove extension
          || 'Custom Music';

        musicFiles.push({
          id,
          name: displayName,
          url: `/uploads/music/${filename}`,
          originalFilename: filename,
          uploadedAt: stats.birthtime.toISOString(),
        });
      }
    }

    // Sort by upload date (newest first)
    musicFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    console.log(`📁 Listed ${musicFiles.length} custom music files`);

    res.status(200).json({
      success: true,
      music: musicFiles
    });

  } catch (error: any) {
    console.error('❌ Error listing music files:', error);
    res.status(500).json({ 
      error: 'Failed to list music files',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}