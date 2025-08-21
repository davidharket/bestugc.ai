// pages/api/music/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
};

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',        // .mp3
  'audio/mp4',         // .m4a
  'audio/wav',         // .wav
  'audio/x-wav',       // .wav (alternative)
  'audio/ogg',         // .ogg
  'audio/webm',        // .webm
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for audio files

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS and upload headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'music');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Parse the uploaded file
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }: { mimetype: string | null }) => {
        return mimetype ? ALLOWED_AUDIO_TYPES.includes(mimetype) : false;
      }
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate a unique filename
    const fileExtension = path.extname(uploadedFile.originalFilename || '');
    const uniqueId = nanoid(12);
    const newFilename = `music_${uniqueId}${fileExtension}`;
    const newPath = path.join(uploadsDir, newFilename);

    // Move file to final location
    fs.renameSync(uploadedFile.filepath, newPath);

    // Create the public URL
    const publicUrl = `/uploads/music/${newFilename}`;

    // Get original filename for display
    const originalName = uploadedFile.originalFilename || 'Unknown';
    const displayName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension

    console.log(`✅ Music uploaded successfully: ${originalName} -> ${publicUrl}`);

    res.status(200).json({
      success: true,
      music: {
        id: uniqueId,
        name: displayName,
        originalFilename: originalName,
        url: publicUrl,
        uploadedBy: session.user.email,
        uploadedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('❌ Music upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Invalid file type. Supported formats: MP3, M4A, WAV, OGG, WebM' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to upload music file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}