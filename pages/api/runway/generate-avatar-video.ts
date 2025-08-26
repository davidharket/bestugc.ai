import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageUrl, productDescription } = req.body

    if (!imageUrl || !productDescription) {
      return res.status(400).json({ error: 'Missing required parameters: imageUrl and productDescription' })
    }

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({ error: 'Runway API key not configured' })
    }

    console.log('Generating video with Runway gen4_turbo...', { imageUrl })

    // Create an improved video prompt based on successful examples
    // The user noted that prompts describing the avatar and product work very well
    const videoPrompt = `From this frame, a video of this blonde woman speaking calmly into the camera with natural head movement and subtle facial expressions. She maintains her exact appearance, pose, and lighting from the starting frame while naturally holding the product. The background and environment remain consistent throughout. ${productDescription.slice(0, 200)}`

    console.log('Using improved video prompt:', videoPrompt)

    // Create video from the selected image
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify({
        promptImage: imageUrl,
        model: "gen4_turbo",
        ratio: "720:1280",
        duration: 5, // 5 seconds as requested
        promptText: videoPrompt,
        seed: Math.floor(Math.random() * 4294967295),
        contentModeration: {
          publicFigureThreshold: "low"
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Runway API error:', response.status, errorData)
      throw new Error(`Runway API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log('Video generation started:', result.id)

    res.status(200).json({
      taskId: result.id,
      status: 'started',
      message: 'Video generation started. Use the task ID to check status.'
    })

  } catch (error: any) {
    console.error('Error generating avatar video:', error)
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      return res.status(429).json({ error: 'Runway API quota exceeded' })
    }
    
    if (error.message.includes('400') || error.message.includes('Bad Request')) {
      return res.status(400).json({ error: 'Invalid request to Runway API' })
    }

    res.status(500).json({ error: `Failed to generate avatar video: ${error.message}` })
  }
}