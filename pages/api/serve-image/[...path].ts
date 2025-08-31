import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { path: imagePath } = req.query
    if (!imagePath || !Array.isArray(imagePath)) {
      return res.status(400).json({ error: 'Invalid image path' })
    }

    const filename = imagePath.join('/')
    const userId = session.user.id

    // Verify the user owns this image by checking the database
    const imageRecord = await prisma.productImage.findFirst({
      where: {
        userId,
        OR: [
          { imageUrl: { contains: filename } },
          { sceneImageUrl: { contains: filename } }
        ]
      }
    })

    if (!imageRecord) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', 'user-images', filename)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Get file stats for headers
    const stats = fs.statSync(filePath)
    const fileExtension = path.extname(filename).toLowerCase()
    
    // Set content type based on extension
    let contentType = 'image/jpeg'
    if (fileExtension === '.png') contentType = 'image/png'
    else if (fileExtension === '.webp') contentType = 'image/webp'
    else if (fileExtension === '.gif') contentType = 'image/gif'

    // Set headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('Last-Modified', stats.mtime.toUTCString())

    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

  } catch (error) {
    console.error('Error serving image:', error)
    return res.status(500).json({ error: 'Failed to serve image' })
  }
}