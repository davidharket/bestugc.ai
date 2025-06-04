import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Summarize the following product information for an ad. Focus on key features, benefits, and what makes it appealing to customers.' },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
      temperature: 0.7,
    })
    const summary = completion.choices[0]?.message?.content || ''
    res.status(200).json({ summary })
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to summarize', details: error.message })
  }
} 