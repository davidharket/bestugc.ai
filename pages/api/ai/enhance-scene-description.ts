import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

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
    const { description, templateImage, imageFilter } = req.body

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' })
    }

    if (description.length > 1000) {
      return res.status(400).json({ error: 'Description too long (max 1000 characters)' })
    }

    let systemPrompt = "You are an expert at creating detailed, vivid scene descriptions for AI image generation, specifically optimized for product placement photography. Enhance the user's scene description to create high-quality backgrounds perfect for placing products. Focus on: professional lighting (soft, even illumination), clean composition with open space for products, appealing color palettes, premium atmosphere, realistic textures, and commercial photography aesthetics. Avoid cluttered or busy backgrounds that would compete with products. Keep under 1000 characters."
    
    let userPrompt = `Enhance this scene description for product placement photography. Create a professional background perfect for showcasing products: "${description}"`

    // If templateImage is provided, adjust the prompts for product replacement
    if (templateImage) {
      if (imageFilter === 'avatar-holding') {
        systemPrompt = "You are an expert at creating detailed scene descriptions for AI image generation featuring people holding products. When given a template image context and user description, create a detailed prompt that maintains the same style, lighting, composition, and person's appearance while having them naturally hold or showcase the user's specific product. Focus on realistic product interaction and natural hand positioning."
        
        userPrompt = `Based on a template image showing a person, create a detailed scene description that maintains the exact same style, lighting, composition, and person's appearance but shows them naturally holding or displaying the new product. User's description: "${description}". 

Important: 
- Keep the same person, their appearance, clothing, and pose
- Maintain the template's lighting style and direction
- Preserve the background elements and composition
- Have the person naturally hold, display, or interact with the product
- Ensure realistic hand positioning and product interaction
- Maintain the same camera angle and perspective
- Describe how the person is showcasing the product

Create a detailed prompt under 1000 characters.`
      } else {
        systemPrompt = "You are an expert at creating detailed scene descriptions for AI image generation that replace existing products in template images with new products. When given a template image context and user description, create a detailed prompt that maintains the same style, lighting, composition, and aesthetic as the template while replacing any existing products with the user's product. Focus on preserving the template's visual qualities while seamlessly integrating the new product."
        
        userPrompt = `Based on a template image that contains an existing product, create a detailed scene description that maintains the exact same style, lighting, composition, and atmosphere but replaces the existing product with a new product. User's description: "${description}". 

Important: 
- Maintain the template's lighting style and direction
- Keep the same background elements and composition
- Preserve the color palette and mood
- Replace only the product while keeping everything else identical
- Ensure the new product fits naturally in the existing scene
- Maintain the same camera angle and perspective

Create a detailed prompt under 1000 characters.`
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })

    const enhancedDescription = completion.choices[0]?.message?.content

    if (!enhancedDescription) {
      throw new Error('Failed to enhance description')
    }

    res.status(200).json({ 
      enhancedDescription: enhancedDescription.trim()
    })

  } catch (error: any) {
    console.error('Error enhancing scene description:', error)
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded' })
    }
    
    if (error.status === 400) {
      return res.status(400).json({ error: 'Invalid request to OpenAI API' })
    }

    res.status(500).json({ error: 'Failed to enhance scene description' })
  }
}