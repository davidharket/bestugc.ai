// pages/api/user/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the current session
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, email } = req.body

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    if (name.length < 1 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be between 1 and 100 characters' })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })
      
      if (existingUser && existingUser.id !== session.user.id) {
        return res.status(400).json({ error: 'Email is already taken by another account' })
      }
    }

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase()
      },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        plan: true
      }
    })

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('Profile update error:', error)
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email is already taken by another account' })
    }
    
    return res.status(500).json({ error: 'Failed to update profile' })
  }
}