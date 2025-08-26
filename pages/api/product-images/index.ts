import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { page = '1', limit = '10' } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const productImages = await prisma.productImage.findMany({
      where: {
        userId: session.user.id
        // Return all images including PENDING/PROCESSING ones
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit as string)
    })

    const total = await prisma.productImage.count({
      where: {
        userId: session.user.id
      }
    })

    return res.status(200).json({
      images: productImages,
      total,
      hasMore: skip + productImages.length < total
    })
  } catch (error) {
    console.error('Error fetching product images:', error)
    return res.status(500).json({ error: 'Failed to fetch product images' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const {
      imageUrl,
      sceneDescription,
      sceneImageUrl,
      productImageUrls,
      aspectRatio,
      enhancedDescription,
      aiEnhanced,
      runwayTaskId,
      status
    } = req.body

    if (!sceneDescription || !sceneImageUrl || !productImageUrls || !aspectRatio) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const productImage = await prisma.productImage.create({
      data: {
        userId: session.user.id,
        imageUrl: imageUrl || '',
        sceneDescription,
        sceneImageUrl,
        productImageUrls: JSON.stringify(productImageUrls),
        aspectRatio,
        enhancedDescription,
        aiEnhanced: Boolean(aiEnhanced),
        runwayTaskId,
        status: status || 'COMPLETED'
      }
    })

    return res.status(201).json(productImage)
  } catch (error) {
    console.error('Error saving product image:', error)
    return res.status(500).json({ error: 'Failed to save product image' })
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { runwayTaskId, imageUrl, status } = req.body

    if (!runwayTaskId) {
      return res.status(400).json({ error: 'runwayTaskId is required' })
    }

    const productImage = await prisma.productImage.updateMany({
      where: {
        userId: session.user.id,
        runwayTaskId: runwayTaskId
      },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(status && { status })
      }
    })

    if (productImage.count === 0) {
      return res.status(404).json({ error: 'Product image not found' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating product image:', error)
    return res.status(500).json({ error: 'Failed to update product image' })
  }
}