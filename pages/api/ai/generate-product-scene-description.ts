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
    const { productImages, sceneImage, sceneDescription, isTemplate } = req.body

    if (!productImages || !Array.isArray(productImages) || productImages.length === 0) {
      return res.status(400).json({ error: 'At least 1 product image is required' })
    }

    if (!sceneImage || !sceneDescription) {
      return res.status(400).json({ error: 'Scene image and description are required' })
    }

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

    // Process scene image
    let sceneImageUrl: string
    if (sceneImage.startsWith('http')) {
      sceneImageUrl = sceneImage
    } else {
      sceneImageUrl = convertToBase64(sceneImage)
    }

    // Process product images
    const processedProductImages = productImages.map((imageUrl: string) => {
      if (imageUrl.startsWith('http')) {
        return imageUrl
      } else {
        return convertToBase64(imageUrl)
      }
    })

    // Create different prompts for template vs regular scene generation
    const promptText = isTemplate 
      ? `Create a detailed description for AI image generation that replaces the existing product in the template image with the new product.

TEMPLATE CONTEXT: ${sceneDescription}

Looking at the template image and the new product images, create a description (under 800 characters) that:

1. Maintains the exact same style, lighting, composition, and atmosphere as the template
2. Replaces the existing product in the template with the new product
3. Keeps the same background, setting, and environmental elements
4. Matches the lighting conditions and shadows to the template
5. Preserves the camera angle and perspective from the template

Focus on seamlessly integrating the new product while maintaining the visual integrity of the original template composition.`
      : `Create a detailed description for AI image generation that combines the product with the scene.

SCENE: ${sceneDescription}

Looking at the scene image and product images, create a description (under 800 characters) that shows the product naturally placed in this scene environment. Focus on:

1. How the product fits into the scene setting
2. Product placement, positioning, and lighting that matches the scene
3. Specific visual details about the product's appearance in this environment
4. Atmosphere and mood that connects the product to the scene

Make it detailed enough for AI image generation but keep it natural and realistic.`

    // Create the chat completion with image analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText
            },
            {
              type: "image_url",
              image_url: {
                url: sceneImageUrl,
                detail: "high"
              }
            },
            ...processedProductImages.map(imageUrl => ({
              type: "image_url" as const,
              image_url: {
                url: imageUrl,
                detail: "high" as const
              }
            }))
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.4
    })

    const description = completion.choices[0]?.message?.content

    if (!description) {
      throw new Error('Failed to generate product scene description')
    }

    res.status(200).json({ 
      description: description.trim()
    })

  } catch (error: any) {
    console.error('Error generating product scene description:', error)
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded' })
    }
    
    if (error.status === 400) {
      return res.status(400).json({ error: 'Invalid request to OpenAI API' })
    }

    res.status(500).json({ error: 'Failed to generate product scene description' })
  }
}