import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { downloadAndStoreImage } from '../../../lib/image-storage'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Check if user is admin (optional - you can add admin role check here)
    
    console.log('🔄 Starting image migration for user:', session.user.id)
    
    // Find all external images for this user
    const externalImages = await prisma.productImage.findMany({
      where: {
        userId: session.user.id,
        AND: [
          {
            OR: [
              { imageUrl: { startsWith: 'http' } },
              { imageUrl: { contains: 'bestugc.ai/images' } }
            ]
          },
          {
            NOT: {
              imageUrl: { startsWith: '/api/serve-image' }
            }
          }
        ],
        status: 'COMPLETED'
      }
    })

    console.log(`📸 Found ${externalImages.length} external images to migrate for user`)

    let successCount = 0
    let failureCount = 0

    for (const image of externalImages) {
      try {
        console.log(`⬇️  Downloading image ${image.id}: ${image.imageUrl}`)
        
        const downloadResult = await downloadAndStoreImage(image.imageUrl, image.userId)
        
        if (downloadResult.success) {
          // Update the database with the new local URL
          await prisma.productImage.update({
            where: { id: image.id },
            data: { imageUrl: downloadResult.localUrl }
          })
          
          console.log(`✅ Migrated image ${image.id} to ${downloadResult.localUrl}`)
          successCount++
        } else {
          console.error(`❌ Failed to download image ${image.id}: ${downloadResult.error}`)
          failureCount++
        }
      } catch (error) {
        console.error(`❌ Error processing image ${image.id}:`, error)
        failureCount++
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Migration completed',
      results: {
        total: externalImages.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    console.error('Error during image migration:', error)
    return res.status(500).json({ error: 'Migration failed' })
  }
}