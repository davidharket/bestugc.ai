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

  try {
    const availableBRoll = getBRollVideos();
    
    if (availableBRoll.length === 0) {
      return res.status(200).json({ suggestions: [] });
    }

    const content = productDescription || scrapedText || '';
    const name = productName || 'product';

    const prompt = `You are helping select relevant B-roll video footage for a marketing video about "${name}".

Product context: ${content.substring(0, 2000)}

Available B-roll videos (filename without .mp4 extension):
${availableBRoll.join('\n')}

Select up to 5 B-roll videos that would be most relevant and effective for marketing this product. Consider:
1. Visual relevance to the product or its use case
2. Emotional appeal and engagement
3. Professional quality for marketing
4. Variety in content types (people, lifestyle, product context, etc.)

Return only the filenames (without .mp4) in order of relevance, separated by newlines.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert video marketing consultant specializing in B-roll selection. Respond with only the selected video filenames, one per line, in order of relevance.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const suggestions = response.choices[0]?.message?.content
      ?.split('\n')
      .map(line => line.trim())
      .filter(line => line && availableBRoll.includes(line))
      .slice(0, 5) || [];

    return res.status(200).json({ 
      suggestions: suggestions.map(filename => `b-roll/${filename}.mp4`)
    });

  } catch (error) {
    console.error('Error suggesting B-roll:', error);
    return res.status(500).json({ error: 'Failed to suggest B-roll videos' });
  }
}