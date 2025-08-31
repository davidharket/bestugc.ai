import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { url, filename } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    // Fetch the image from the external URL
    const response = await fetch(url)
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' })
    }

    const imageBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'product-image.jpg'}"`)
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Send the image
    res.send(buffer)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: 'Failed to download image' })
  }
}