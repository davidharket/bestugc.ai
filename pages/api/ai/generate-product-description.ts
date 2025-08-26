import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { images, avatarImage } = req.body

    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ error: 'At least 2 product images are required' })
    }

    if (!avatarImage) {
      return res.status(400).json({ error: 'Avatar image is required' })
    }

    // Determine avatar gender based on the filename
    const isFemaleBased = avatarImage.toLowerCase().includes('female')
    const gender = isFemaleBased ? 'woman' : 'man'
    const pronounSubject = isFemaleBased ? 'She' : 'He'
    const pronounObject = isFemaleBased ? 'her' : 'his'

    // Helper function to convert local images to base64 data URLs
    const convertToBase64 = (imagePath: string): string => {
      try {
        const fullPath = path.join(process.cwd(), 'public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath)
        const imageBuffer = fs.readFileSync(fullPath)
        const base64Image = imageBuffer.toString('base64')
        const mimeType = imagePath.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg'
        return `data:${mimeType};base64,${base64Image}`
      } catch (error) {
        console.error('Error reading image:', imagePath, error)
        throw new Error(`Failed to load image: ${imagePath}`)
      }
    }

    // Convert avatar image to base64
    let avatarImageUrl: string
    if (avatarImage.startsWith('http')) {
      avatarImageUrl = avatarImage
    } else {
      avatarImageUrl = convertToBase64(avatarImage)
    }

    // Convert all product images to base64 (since uploaded images are local paths)
    const processedImages = images.map((imageUrl: string) => {
      if (imageUrl.startsWith('http')) {
        return imageUrl // External URLs can be used directly
      } else {
        // Convert local uploaded images to base64
        return convertToBase64(imageUrl)
      }
    })

    // Create the chat completion with image analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these product images and create a detailed but concise description (under 150 words) of the avatar holding this product for AI image generation.

The avatar is a ${gender}. Include:
1. PRODUCT DETAILS: Exact product name, type, colors, materials, key design features, shape, size, buttons/controls, unique elements
2. HOW ${gender.toUpperCase()} HOLDS IT: Specific hand position, grip, angle, presentation style
3. PRODUCT POSITIONING: How the product is oriented, what parts are visible, professional presentation angle

Focus on visual details that an AI image generator needs. Be specific about colors, textures, and physical characteristics. Describe the product as if someone has never seen it before.`
            },
            {
              type: "image_url",
              image_url: {
                url: avatarImageUrl,
                detail: "high"
              }
            },
            ...processedImages.map(imageUrl => ({
              type: "image_url" as const,
              image_url: {
                url: imageUrl,
                detail: "high" as const
              }
            }))
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    })

    const baseDescription = completion.choices[0]?.message?.content

    if (!baseDescription) {
      throw new Error('Failed to generate description')
    }

    // For video description, keep the detailed product description but format it properly
    const videoDescription = `From this frame, a video of this ${gender} speaking calmly into the camera. ${pronounSubject} is sitting calmly without moving ${pronounObject} hands. ${pronounSubject} looks directly into the camera without breaking eye contact. ${baseDescription}`

    res.status(200).json({ 
      description: videoDescription,
      baseDescription: baseDescription,
      gender,
      pronouns: {
        subject: pronounSubject,
        object: pronounObject
      }
    })

  } catch (error: any) {
    console.error('Error generating product description:', error)
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded' })
    }
    
    if (error.status === 400) {
      return res.status(400).json({ error: 'Invalid request to OpenAI API' })
    }

    res.status(500).json({ error: 'Failed to generate product description' })
  }
}