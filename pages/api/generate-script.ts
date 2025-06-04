import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const systemPrompts: Record<string, string> = {
  cta: 'Write a short, engaging video ad script with a strong call to action. Focus on the product benefits and end with a clear CTA.',
  lifestyle: 'Write a video ad script that tells a product lifestyle story. Show how the product fits into the customer's life.',
  brand: 'Write a video ad script that highlights the brand story and values, connecting emotionally with the audience.',
  trending: 'Write a video ad script that uses a trending topic or meme style to promote the product in a fun, viral way.',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { promptType, summary, productName, brandName, promoDetails, language } = req.body
  if (!promptType || !systemPrompts[promptType]) {
    return res.status(400).json({ error: 'Invalid promptType' })
  }
  if (!summary) {
    return res.status(400).json({ error: 'Missing summary' })
  }

  let userPrompt = `Product: ${productName || brandName || ''}\nSummary: ${summary}`
  if (promoDetails) userPrompt += `\nPromotion: ${promoDetails}`
  if (language && language !== 'en') userPrompt += `\nLanguage: ${language}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompts[promptType] },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.8,
    })
    const script = completion.choices[0]?.message?.content || ''
    res.status(200).json({ script })
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate script', details: error.message })
  }
} 