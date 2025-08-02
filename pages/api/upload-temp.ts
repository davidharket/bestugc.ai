import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Disable default body parser for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const uploadId = crypto.randomBytes(8).toString('hex');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'temp', uploadId);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      multiples: true,
      filter: ({ mimetype }) => {
        // Allow images and videos
        return !!(mimetype?.includes('image/') || mimetype?.includes('video/'));
      }
    });

    const [fields, files] = await form.parse(req);
    
    const uploadedFiles = [];
    const fileArray = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean);

    for (const file of fileArray) {
      if (file && file.filepath) {
        // Generate a clean filename
        const ext = path.extname(file.originalFilename || '');
        const fileName = crypto.randomBytes(6).toString('hex') + ext;
        const newPath = path.join(uploadDir, fileName);
        
        // Move file to clean filename
        fs.renameSync(file.filepath, newPath);
        
        // Return public URL
        const publicUrl = `/uploads/temp/${uploadId}/${fileName}`;
        uploadedFiles.push({
          originalName: file.originalFilename,
          url: publicUrl,
          size: file.size,
          type: file.mimetype
        });
      }
    }

    console.log(`[Upload] User ${session.user.id} uploaded ${uploadedFiles.length} files to ${uploadId}`);
    
    return res.status(200).json({ 
      success: true, 
      files: uploadedFiles 
    });

  } catch (error: any) {
    console.error('[Upload] Error uploading files:', error);
    return res.status(500).json({ 
      error: 'Failed to upload files', 
      details: error.message 
    });
  }
}