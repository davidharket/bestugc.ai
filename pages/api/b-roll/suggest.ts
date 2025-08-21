import { NextApiRequest, NextApiResponse } from 'next';
import { AzureOpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
});

// Get all available B-roll videos
function getBRollVideos(): string[] {
  const bRollDir = path.join(process.cwd(), 'b-roll');
  
  if (!fs.existsSync(bRollDir)) {
    return [];
  }
  
  return fs.readdirSync(bRollDir)
    .filter(file => file.toLowerCase().endsWith('.mp4'))
    .map(file => file.replace('.mp4', ''));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productDescription, productName, scrapedText } = req.body;

  if (!productDescription && !scrapedText) {
    return res.status(400).json({ error: 'Product description or scraped text is required' });
  }

  // Clean content to avoid content policy issues
  const cleanContent = (content: string): string => {
    return content
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/[^\s]+@[^\s]+\.[^\s]+/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/[^\w\s.,!?()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  try {
    const availableBRoll = getBRollVideos();
    
    if (availableBRoll.length === 0) {
      return res.status(200).json({ suggestions: [] });
    }

    const content = cleanContent(productDescription || scrapedText || '');
    const name = (productName || 'product').replace(/[^\w\s-]/g, ' ').trim();

    const prompt = `Select relevant video footage for a business product presentation about "${name}".

Product information: ${content.substring(0, 1500)}

Available videos:
${availableBRoll.join('\n')}

Choose up to 5 videos that best match this product for professional marketing use. Consider visual relevance and business appeal.

List only the video filenames, one per line.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional video production assistant. Select appropriate business video footage based on product context. Respond only with video filenames, one per line.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.2,
    });

    const suggestions = response.choices[0]?.message?.content
      ?.split('\n')
      .map(line => line.trim())
      .filter(line => line && availableBRoll.includes(line))
      .slice(0, 5) || [];

    return res.status(200).json({ 
      suggestions: suggestions.map(filename => `b-roll/${filename}.mp4`)
    });

  } catch (error: any) {
    console.error('Error suggesting B-roll:', error);
    
    // Fallback: if content filtering fails, return random selection
    if (error.code === 'content_filter') {
      const availableBRoll = getBRollVideos();
      const randomSuggestions = availableBRoll
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(filename => `b-roll/${filename}.mp4`);
      
      return res.status(200).json({ 
        suggestions: randomSuggestions,
        note: 'Random selection due to content policy restrictions'
      });
    }
    
    return res.status(500).json({ error: 'Failed to suggest B-roll videos' });
  }
}