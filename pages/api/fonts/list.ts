// pages/api/fonts/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

interface UploadedFont {
  id: string;
  name: string;
  filename: string;
  path: string;
  uploadedAt: Date;
  userId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Read font metadata
    const metadataPath = path.join(process.cwd(), 'public', 'fonts', 'custom', 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(200).json({ fonts: [] });
    }

    const existingData = fs.readFileSync(metadataPath, 'utf8');
    const allFonts: UploadedFont[] = JSON.parse(existingData);

    // Filter fonts for current user
    const userFonts = allFonts.filter(font => font.userId === session.user?.email);

    // Return fonts in format expected by frontend
    const formattedFonts = userFonts.map(font => ({
      id: font.id,
      name: font.name,
      fontFamily: font.name,
      category: 'custom' as const,
      description: 'Custom uploaded font',
      type: 'custom' as const,
      uploadedFile: font.path.startsWith('/api/serve-fonts/') 
        ? font.path 
        : `/api/serve-fonts/custom/${font.filename}`, // Update old paths
      uploadedAt: font.uploadedAt
    }));

    return res.status(200).json({ fonts: formattedFonts });

  } catch (error: any) {
    console.error('Font list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}