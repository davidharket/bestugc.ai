import type { NextApiRequest, NextApiResponse } from 'next';
import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productDescription, productCategory } = req.body;

  if (!productDescription || typeof productDescription !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid productDescription' });
  }

  let userContent = `Product Description: ${productDescription}`;
  if (productCategory && typeof productCategory === 'string' && productCategory.trim() !== '') {
    userContent += `\nProduct Category: ${productCategory}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing assistant. Based on the following product information, generate 5 distinct target audience suggestions for an ad campaign. Each suggestion should be concise (3-7 words). Use the function call to return the suggestions as a JSON array of strings.'
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: 300,
      temperature: 0.7,
      functions: [
        {
          name: 'suggest_audiences',
          description: 'Suggest 5 concise target audiences for an ad campaign as an array of strings.',
          parameters: {
            type: 'object',
            properties: {
              audiences: {
                type: 'array',
                items: {
                  type: 'string',
                  description: 'A concise audience description (3-7 words)'
                },
                minItems: 5,
                maxItems: 5,
                description: 'An array of 5 concise audience suggestions.'
              }
            },
            required: ['audiences']
          }
        }
      ],
      function_call: { name: 'suggest_audiences' },
    });

    let suggestions: string[] = [];
    const functionCall = completion.choices[0]?.message?.function_call;
    if (functionCall && functionCall.arguments) {
      try {
        const args = JSON.parse(functionCall.arguments);
        if (Array.isArray(args.audiences) && args.audiences.every((s: string) => typeof s === 'string')) {
          suggestions = args.audiences;
        } else {
          return res.status(500).json({ error: 'AI did not return a valid array of audience strings.' });
        }
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse AI function call arguments.' });
      }
    } else {
      return res.status(500).json({ error: 'No function call response from AI.' });
    }

    res.status(200).json({ suggestions });

  } catch (error: any) {
    console.error('OpenAI API error (audience suggestions):', error.message);
    res.status(500).json({ error: 'Failed to generate audience suggestions', details: error.message });
  }
} 