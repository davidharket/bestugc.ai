import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { productDescription, avatarImage, productImages } = req.body

    if (!productDescription || !avatarImage || !productImages) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({ error: 'Runway API key not configured' })
    }

    // Helper function to convert and fix aspect ratio of images for Runway API
    const convertToBase64WithAspectFix = async (imagePath: string): Promise<string> => {
      try {
        const fullPath = path.join(process.cwd(), 'public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath)
        const imageBuffer = fs.readFileSync(fullPath)
        
        // Get image metadata to check aspect ratio
        const metadata = await sharp(imageBuffer).metadata()
        const { width, height } = metadata
        
        if (!width || !height) {
          throw new Error('Could not determine image dimensions')
        }
        
        const currentRatio = width / height
        console.log(`Image ${imagePath}: ${width}x${height}, ratio: ${currentRatio.toFixed(3)}`)
        
        let processedBuffer: Buffer
        
        // Check if aspect ratio is within Runway's requirements (0.5 to 2.0)
        if (currentRatio < 0.5) {
          // Image is too tall, crop from top/bottom to make it wider
          const newHeight = Math.floor(width / 0.5) // Target ratio of 0.5 (minimum)
          const cropTop = Math.floor((height - newHeight) / 2)
          
          processedBuffer = await sharp(imageBuffer)
            .extract({ 
              left: 0, 
              top: Math.max(0, cropTop), 
              width: width, 
              height: Math.min(height, newHeight) 
            })
            .toBuffer()
            
          console.log(`Fixed aspect ratio: cropped to make wider (ratio ~0.5)`)
        } else if (currentRatio > 2.0) {
          // Image is too wide, crop from left/right to make it taller  
          const newWidth = Math.floor(height * 2.0) // Target ratio of 2.0 (maximum)
          const cropLeft = Math.floor((width - newWidth) / 2)
          
          processedBuffer = await sharp(imageBuffer)
            .extract({ 
              left: Math.max(0, cropLeft), 
              top: 0, 
              width: Math.min(width, newWidth), 
              height: height 
            })
            .toBuffer()
            
          console.log(`Fixed aspect ratio: cropped to make taller (ratio ~2.0)`)
        } else {
          // Aspect ratio is within acceptable range
          processedBuffer = imageBuffer
          console.log(`Aspect ratio is acceptable: ${currentRatio.toFixed(3)}`)
        }
        
        const base64Image = processedBuffer.toString('base64')
        const mimeType = imagePath.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg'
        return `data:${mimeType};base64,${base64Image}`
      } catch (error) {
        console.error('Error processing image for Runway:', imagePath, error)
        throw new Error(`Failed to process image: ${imagePath}`)
      }
    }

    // Helper function for backwards compatibility (no aspect ratio fix)
    const convertToBase64 = (imagePath: string): string => {
      try {
        const fullPath = path.join(process.cwd(), 'public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath)
        const imageBuffer = fs.readFileSync(fullPath)
        const base64Image = imageBuffer.toString('base64')
        const mimeType = imagePath.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg'
        return `data:${mimeType};base64,${base64Image}`
      } catch (error) {
        console.error('Error reading image for Runway:', imagePath, error)
        throw new Error(`Failed to load image: ${imagePath}`)
      }
    }

    // Prepare reference images - AVATAR MUST BE FIRST for consistent base appearance
    const referenceImages: Array<{ uri: string; tag: string }> = []
    
    // Add avatar image FIRST (primary reference for consistent face/body)
    const avatarImageUrl = avatarImage.startsWith('http') 
      ? avatarImage 
      : convertToBase64(avatarImage)
    
    referenceImages.push({
      uri: avatarImageUrl,
      tag: "avatar"
    })
    
    // Add up to 2 product images with aspect ratio correction
    const maxProductImages = Math.min(2, productImages.length)
    for (let i = 0; i < maxProductImages; i++) {
      try {
        let imageUrl: string
        if (productImages[i].startsWith('http')) {
          imageUrl = productImages[i]
        } else {
          // Use aspect ratio fixing function for uploaded product images
          imageUrl = await convertToBase64WithAspectFix(productImages[i])
        }
        
        referenceImages.push({
          uri: imageUrl,
          tag: `product${i + 1}`
        })
      } catch (error) {
        console.warn(`Failed to process product image ${i + 1}:`, error)
        // Continue with other images even if one fails
      }
    }

    // Create a shorter, focused prompt (under 1000 characters)
    const promptParts = productDescription.split('. ')
    let shortDescription = promptParts[0] + '.'
    
    // Add more parts if under character limit
    for (let i = 1; i < promptParts.length; i++) {
      const testPrompt = shortDescription + ' ' + promptParts[i] + '. @avatar in her original setting and background, maintaining her exact appearance and character, naturally holding @product1. Keep the same lighting, pose, and environment as the original avatar image.'
      if (testPrompt.length < 950) {
        shortDescription += ' ' + promptParts[i] + '.'
      } else {
        break
      }
    }

    const enhancedPrompt = `${shortDescription} @avatar in her original setting and background, maintaining her exact appearance and character, naturally holding @product1. Keep the same lighting, pose, and environment as the original avatar image.`
    
    console.log('Runway prompt length:', enhancedPrompt.length)

    console.log('Generating 4 images with Runway GEN-4...')
    
    // Generate 4 images without waiting for completion to avoid timeout
    const imagePromises = Array.from({ length: 4 }, async (_, index) => {
      console.log(`Starting image generation ${index + 1}/4...`)
      
      try {
        const response = await fetch('https://api.dev.runwayml.com/v1/text_to_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06'
          },
          body: JSON.stringify({
            promptText: enhancedPrompt,
            model: "gen4_image",
            ratio: "720:1280", // Changed to 9:16 vertical format for mobile/TikTok/Instagram
            seed: Math.floor(Math.random() * 4294967295), // Random seed for variation
            referenceImages: referenceImages,
            contentModeration: {
              publicFigureThreshold: "low"
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error(`Image ${index + 1} API error:`, response.status, errorData)
          throw new Error(`Runway API error: ${response.status} - ${errorData}`)
        }

        const result = await response.json()
        console.log(`Image ${index + 1} task created:`, result.id)
        
        return {
          id: result.id,
          taskId: result.id,
          index
        }
      } catch (error) {
        console.error(`Error creating image ${index + 1}:`, error)
        throw error
      }
    })

    console.log('Waiting for all 4 image tasks to be created...')
    const tasks = await Promise.all(imagePromises)
    console.log('All tasks created, returning task IDs immediately to avoid timeout...')
    
    // Return task IDs immediately instead of waiting for completion
    const pendingImages = tasks.map(task => ({
      id: `img-${task.index}-${Date.now()}`,
      taskId: task.taskId,
      status: 'PENDING',
      url: null // Will be populated when checking status
    }))

    console.log('Returning pending tasks:', JSON.stringify({
      images: pendingImages,
      count: pendingImages.length,
      status: 'PROCESSING'
    }, null, 2))
    
    res.status(200).json({
      images: pendingImages,
      count: pendingImages.length,
      status: 'PROCESSING'
    })

  } catch (error: any) {
    console.error('Error generating avatar images:', error)
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      return res.status(429).json({ error: 'Runway API quota exceeded' })
    }
    
    if (error.message.includes('400') || error.message.includes('Bad Request')) {
      return res.status(400).json({ error: 'Invalid request to Runway API' })
    }

    res.status(500).json({ error: `Failed to generate avatar images: ${error.message}` })
  }
}