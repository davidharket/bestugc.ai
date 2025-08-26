import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { description, aspectRatio, count, templateImage } = req.body

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description is required' })
    }

    if (!aspectRatio || typeof aspectRatio !== 'string') {
      return res.status(400).json({ error: 'Aspect ratio is required' })
    }

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({ error: 'Runway API key not configured' })
    }

    // Convert aspect ratio to Runway format (using accepted ratios from API)
    const aspectRatioMap: { [key: string]: string } = {
      '21:9': '1808:768',  // Ultra-wide (21:9 ≈ 2.36, closest accepted ratio)
      '16:9': '1280:720',  // Standard HD
      '4:3': '1360:768',   // Traditional (4:3 ≈ 1.33, closest accepted ratio)  
      '1:1': '1024:1024',  // Square
      '3:4': '1080:1440',  // Portrait (3:4 = 0.75, closest accepted ratio)
      '9:16': '720:1280'   // Mobile/vertical
    }

    const runwayRatio = aspectRatioMap[aspectRatio] || '1280:720'

    // Ensure description is under 1000 characters for Runway
    const trimmedDescription = description.length > 1000 
      ? description.substring(0, 1000)
      : description

    console.log('Generating scene images with Runway GEN-4...')
    console.log('Aspect ratio:', aspectRatio, '->', runwayRatio)
    console.log('Description length:', trimmedDescription.length)
    console.log('Template image:', templateImage ? 'Yes' : 'No')

    const imageCount = Math.min(count || 4, 4) // Max 4 images

    // Generate multiple images
    const imagePromises = Array.from({ length: imageCount }, async (_, index) => {
      console.log(`Starting scene image generation ${index + 1}/${imageCount}...`)
      
      try {
        // If templateImage is provided, enhance the description to reference the template
        const finalDescription = templateImage 
          ? `${trimmedDescription} (styled like the provided reference template)`
          : trimmedDescription

        const response = await fetch('https://api.dev.runwayml.com/v1/text_to_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06'
          },
          body: JSON.stringify({
            promptText: finalDescription,
            model: "gen4_image",
            ratio: runwayRatio,
            seed: Math.floor(Math.random() * 4294967295), // Random seed for variation
            contentModeration: {
              publicFigureThreshold: "low"
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error(`Scene image ${index + 1} API error:`, response.status, errorData)
          throw new Error(`Runway API error: ${response.status} - ${errorData}`)
        }

        const result = await response.json()
        console.log(`Scene image ${index + 1} task created:`, result.id)
        
        return {
          id: `scene-${index}-${Date.now()}`,
          taskId: result.id,
          status: 'PENDING',
          url: null // Will be populated when checking status
        }
      } catch (error) {
        console.error(`Error creating scene image ${index + 1}:`, error)
        throw error
      }
    })

    console.log('Waiting for all scene image tasks to be created...')
    const tasks = await Promise.all(imagePromises)
    console.log('All scene tasks created, returning task IDs immediately to avoid timeout...')
    
    // Return task IDs immediately instead of waiting for completion
    const pendingImages = tasks.map(task => ({
      id: task.id,
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
    console.error('Error generating scene images:', error)
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      return res.status(429).json({ error: 'Runway API quota exceeded' })
    }
    
    if (error.message.includes('400') || error.message.includes('Bad Request')) {
      return res.status(400).json({ error: 'Invalid request to Runway API' })
    }

    res.status(500).json({ error: `Failed to generate scene images: ${error.message}` })
  }
}