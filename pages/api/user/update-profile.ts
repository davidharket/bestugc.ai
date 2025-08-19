import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Corrected path
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { name } = req.body;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty.' });
  }

  if (name.length > 100) { // Basic validation for length
    return res.status(400).json({ error: 'Name is too long (maximum 100 characters).' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });

    // Optionally, you can return the updated user object or parts of it
    res.status(200).json({ message: 'Profile updated successfully', user: { name: updatedUser.name } });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    // Check for specific Prisma errors if needed, e.g., P2025 (Record to update not found)
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found.' });
    }
    res.status(500).json({ error: 'Failed to update profile.', details: error.message });
  }
} 