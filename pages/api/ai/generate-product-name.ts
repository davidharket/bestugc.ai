// pages/api/ai/generate-product-name.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ SECURITY FIX: Check for the internal secret header
  if (req.headers['x-internal-secret'] !== process.env.TEST_SECRET_KEY) {
    // This is not a request from our own server, so reject it.
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scrapedText, rawProductName, productUrl } = req.body;

  if (!scrapedText || typeof scrapedText !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid scrapedText' });
  }

  try {
    const systemPrompt = `You are an expert at analyzing product pages and generating clean, professional product names. Based on the scraped content from a product page, generate a concise and professional product name that would be suitable for marketing materials.

Guidelines:
- Extract the most relevant product name from the content
- Clean up any formatting issues, excess spaces, or special characters
- Keep it concise but descriptive
- Include brand name if clearly identifiable
- Include key product descriptors (color, model, type) if relevant
- Make it marketing-friendly
- Return only the product name, nothing else`;

    let userPrompt = `Scraped content from product page: ${scrapedText.substring(0, 2000)}`;
    if (rawProductName) userPrompt += `\n\nRaw extracted product name: ${rawProductName}`;
    if (productUrl) userPrompt += `\n\nProduct URL: ${productUrl}`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const productName = completion.choices[0]?.message?.content?.trim() || '';
    res.status(200).json({ productName });

  } catch (error: any) {
    console.error('Azure OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to generate product name', details: error.message });
  }
}
