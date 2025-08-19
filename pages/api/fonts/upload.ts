// pages/api/fonts/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_FONT_TYPES = [
  'font/woff',
  'font/woff2',
  'font/ttf',
  'font/otf',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/octet-stream'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

interface UploadedFont {
  id: string;
  name: string;
  filename: string;
  path: string;
  uploadedAt: Date;
  userId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'fonts', 'custom');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Parse form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }: { mimetype: string | null }) => {
        return mimetype ? ALLOWED_FONT_TYPES.includes(mimetype) : false;
      }
    });

    // @ts-ignore
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const fontFile = Array.isArray(files.font) ? files.font[0] : files.font;
    const fontName = Array.isArray(fields.name) ? fields.name[0] : fields.name;

    if (!fontFile || !fontName) {
      return res.status(400).json({ error: 'Font file and name are required' });
    }

    // Generate unique filename
    const fileExtension = path.extname(fontFile.originalFilename || '');
    const uniqueId = uuidv4();
    const newFilename = `${uniqueId}${fileExtension}`;
    const newPath = path.join(uploadsDir, newFilename);

    // Move file to final location
    fs.renameSync(fontFile.filepath, newPath);

    // Create font record
    const uploadedFont: UploadedFont = {
      id: uniqueId,
      name: fontName,
      filename: newFilename,
      path: `/api/serve-fonts/custom/${newFilename}`,
      uploadedAt: new Date(),
      userId: session.user.email!
    };

    // Save font metadata to a JSON file (simple storage)
    const metadataPath = path.join(uploadsDir, 'metadata.json');
    let metadata: UploadedFont[] = [];
    
    if (fs.existsSync(metadataPath)) {
      const existingData = fs.readFileSync(metadataPath, 'utf8');
      metadata = JSON.parse(existingData);
    }
    
    metadata.push(uploadedFont);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Return success response
    return res.status(200).json({
      success: true,
      font: {
        id: uploadedFont.id,
        name: uploadedFont.name,
        path: uploadedFont.path
      }
    });

  } catch (error: any) {
    console.error('Font upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    
    if (error.code === 'LIMIT_FILE_TYPE') {
      return res.status(400).json({ error: 'Invalid file type. Only WOFF, WOFF2, TTF, and OTF files are allowed.' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}