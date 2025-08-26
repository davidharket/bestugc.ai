import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { description, sceneImage, productImages, aspectRatio, count } = req.body

    if (!description || !sceneImage || !productImages) {
      return res.status(400).json({ error: 'Description, scene image, and product images are required' })
    }

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({ error: 'Runway API key not configured' })
    }

    const convertToBase64WithAspectFix = async (imagePath: string): Promise<string> => {
      try {
        const fullPath = path.join(process.cwd(), 'public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath)

        const imageBuffer = fs.readFileSync(fullPath)
        const metadata = await sharp(imageBuffer).metadata()
        const { width, height } = metadata

        if (!width || !height) {
          throw new Error('Could not determine image dimensions')
        }

        const currentRatio = width / height
        console.log(`Image ${imagePath}: ${width}x${height}, ratio: ${currentRatio.toFixed(3)}`)

        let processedBuffer: Buffer

        if (currentRatio < 0.5) {
          const newHeight = Math.floor(width / 0.5)
          const cropTop = Math.floor((height - newHeight) / 2)
          processedBuffer = await sharp(imageBuffer)
            .extract({ left: 0, top: Math.max(0, cropTop), width: width, height: Math.min(height, newHeight) })
            .resize({ width: Math.min(1024, width), withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer()
          console.log(`Fixed aspect ratio: cropped to make wider (ratio ~0.5)`)
        } else if (currentRatio > 2.0) {
          const newWidth = Math.floor(height * 2.0)
          const cropLeft = Math.floor((width - newWidth) / 2)
          processedBuffer = await sharp(imageBuffer)
            .extract({ left: Math.max(0, cropLeft), top: 0, width: Math.min(width, newWidth), height: height })
            .resize({ width: Math.min(1024, width), withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer()
          console.log(`Fixed aspect ratio: cropped to make taller (ratio ~2.0)`)
        } else {
          processedBuffer = await sharp(imageBuffer)
            .resize({ width: Math.min(1024, width), withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer()
          console.log(`Aspect ratio is acceptable: ${currentRatio.toFixed(3)}`)
        }

        const base64Image = processedBuffer.toString('base64')
        const base64Size = base64Image.length
        console.log(`Compressed image size: ${(base64Size / 1024 / 1024).toFixed(2)}MB`)

        if (base64Size > 4 * 1024 * 1024) {
          console.log('Image still too large after compression, applying aggressive compression...')
          processedBuffer = await sharp(processedBuffer)
            .resize({ width: 512, withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer()
          const compressedBase64 = processedBuffer.toString('base64')
          console.log(`Aggressively compressed image size: ${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`)
          return `data:image/jpeg;base64,${compressedBase64}`
        }

        return `data:image/jpeg;base64,${base64Image}`
      } catch (error) {
        console.error('Error processing image for Runway:', imagePath, error)
        throw new Error(`Failed to process image: ${imagePath}`)
      }
    }

    const convertToBase64 = async (imagePath: string): Promise<string> => {
        try {
            const fullPath = path.join(process.cwd(), 'public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath)
            const imageBuffer = fs.readFileSync(fullPath)
            const processedBuffer = await sharp(imageBuffer)
            .resize({ width: Math.min(1024, 1024), withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer()
    
            const base64Image = processedBuffer.toString('base64')
            const base64Size = base64Image.length
            console.log(`Scene image compressed size: ${(base64Size / 1024 / 1024).toFixed(2)}MB`)
    
            if (base64Size > 4 * 1024 * 1024) {
            console.log('Scene image still too large, applying aggressive compression...')
            const aggressiveBuffer = await sharp(processedBuffer)
                .resize({ width: 512, withoutEnlargement: true })
                .jpeg({ quality: 70 })
                .toBuffer()
            const compressedBase64 = aggressiveBuffer.toString('base64')
            console.log(`Aggressively compressed scene image size: ${(compressedBase64.length / 1024 / 1024).toFixed(2)}MB`)
            return `data:image/jpeg;base64,${compressedBase64}`
            }
    
            return `data:image/jpeg;base64,${base64Image}`
        } catch (error) {
            console.error('Error reading image for Runway:', imagePath, error)
            throw new Error(`Failed to load image: ${imagePath}`)
        }
    }
    
    const aspectRatioMap: { [key: string]: string } = {
        '21:9': '1808:768', '16:9': '1280:720', '4:3': '1360:768',
        '1:1': '1024:1024', '3:4': '1080:1440', '9:16': '720:1280'
    }
    const runwayRatio = aspectRatioMap[aspectRatio] || '1280:720'

    const referenceImages: Array<{ uri: string; tag: string }> = []

    const sceneImageUrl = sceneImage.startsWith('http') ? sceneImage : await convertToBase64(sceneImage)
    referenceImages.push({ uri: sceneImageUrl, tag: "scene" })

    const maxProductImages = Math.min(2, productImages.length)
    for (let i = 0; i < maxProductImages; i++) {
        try {
            let imageUrl: string
            if (productImages[i].startsWith('http')) {
                imageUrl = productImages[i]
            } else {
                imageUrl = await convertToBase64WithAspectFix(productImages[i])
            }
            referenceImages.push({ uri: imageUrl, tag: `product${i + 1}` })
        } catch (error) {
            console.warn(`Failed to process product image ${i + 1}:`, error)
        }
    }

    const trimmedDescription = description.length > 1000 ? description.substring(0, 1000) : description
    const enhancedPrompt = `${trimmedDescription} @scene setting and environment, with @product1 naturally placed in the scene. Professional product photography style with consistent lighting and atmosphere.`

    console.log('Runway prompt length:', enhancedPrompt.length)
    console.log('Generating product scene images with Runway GEN-4...')
    console.log('Aspect ratio:', aspectRatio, '->', runwayRatio)

    const imageCount = Math.min(count || 2, 2)

    const imagePromises = Array.from({ length: imageCount }, async (_, index) => {
      console.log(`Starting product scene image generation ${index + 1}/${imageCount}...`)
      try {
        const response = await fetch('https://api.dev.runwayml.com/v1/text_to_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06'
          },
          body: JSON.stringify({
            promptText: enhancedPrompt, model: "gen4_image", ratio: runwayRatio,
            seed: Math.floor(Math.random() * 4294967295), referenceImages: referenceImages,
            contentModeration: { publicFigureThreshold: "low" }
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error(`Product image ${index + 1} API error:`, response.status, errorData)
          throw new Error(`Runway API error: ${response.status} - ${errorData}`)
        }

        const result = await response.json()
        console.log(`Product image ${index + 1} task created:`, result.id)
        return {
          id: `product-scene-${index}-${Date.now()}`,
          taskId: result.id,
          status: 'PENDING',
          url: null
        }
      } catch (error) {
        console.error(`Error creating product scene image ${index + 1}:`, error)
        throw error
      }
    })

    console.log('Waiting for all product scene image tasks to be created...')
    const tasks = await Promise.all(imagePromises)
    console.log('All product scene tasks created, returning task IDs immediately to avoid timeout...')
    
    const pendingImages = tasks.map(task => ({
      id: task.id,
      taskId: task.taskId,
      status: 'PENDING',
      url: null
    }))

    console.log('Returning pending product scene tasks:', JSON.stringify({
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
    
    console.error('Error generating product scene images:', error)
    if (error.message.includes('quota') || error.message.includes('429')) {
      return res.status(429).json({ error: 'Runway API quota exceeded' })
    }
    if (error.message.includes('400') || error.message.includes('Bad Request')) {
      return res.status(400).json({ error: 'Invalid request to Runway API' })
    }
    res.status(500).json({ error: `Failed to generate product scene images: ${error.message}` })
  }
}
