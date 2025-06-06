import type { NextApiRequest, NextApiResponse } from 'next'
import { AzureOpenAI } from 'openai'

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
})

const systemPrompts: Record<string, (duration?: number) => string> = {
  cta: (duration) => `Write a short, engaging video ad script with a strong call to action. Focus on the product benefits and end with a clear CTA. The script must be suitable for a text-to-speech model (plain text only, no markdown, no formatting, no bold, no asterisks). The script should fit a video of approximately ${duration || 30} seconds.`,
  lifestyle: (duration) => `Write a video ad script that tells a product lifestyle story. Show how the product fits into the customer's life. The script must be suitable for a text-to-speech model (plain text only, no markdown, no formatting, no bold, no asterisks). The script should fit a video of approximately ${duration || 30} seconds.`,
  brand: (duration) => `Write a video ad script that highlights the brand story and values, connecting emotionally with the audience. The script must be suitable for a text-to-speech model (plain text only, no markdown, no formatting, no bold, no asterisks). The script should fit a video of approximately ${duration || 30} seconds.`,
  trending: (duration) => `Write a video ad script that uses a trending topic or meme style to promote the product in a fun, viral way. The script must be suitable for a text-to-speech model (plain text only, no markdown, no formatting, no bold, no asterisks). The script should fit a video of approximately ${duration || 30} seconds.`,
  custom: (duration) => `Write a custom video ad script based on the provided summary and details. The script must be suitable for a text-to-speech model (plain text only, no markdown, no formatting, no bold, no asterisks). The script should fit a video of approximately ${duration || 30} seconds.`,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Accept promptTypes as an array, or default to all types
  const { promptTypes, summary, productName, brandName, promoDetails, language, duration, regenerate } = req.body;
  const scriptTypes: string[] = Array.isArray(promptTypes) && promptTypes.length > 0
    ? promptTypes
    : ['cta', 'lifestyle', 'brand', 'trending', 'custom'];

  if (!summary) {
    return res.status(400).json({ error: 'Missing summary' })
  }

  let userPrompt = `Product: ${productName || brandName || ''}\nSummary: ${summary}`
  if (promoDetails) userPrompt += `\nPromotion: ${promoDetails}`
  if (language && language !== 'en') userPrompt += `\nLanguage: ${language}`

  // Compose the function schema for structured output
  const scriptProperties: Record<string, any> = {};
  for (const type of scriptTypes) {
    scriptProperties[type] = {
      type: 'string',
      description: `The ${type} video ad script.`
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        {
          role: 'system',
          content: `You are an expert video ad script writer. You MUST use the function call to return your answer. Do NOT write any text outside the function call. For each script type, generate a script as described. Each script must be suitable for a text-to-speech model (plain text only, no markdown, no formatting, no bold, no asterisks). Each script should fit a video of approximately ${duration || 30} seconds. Return the result as a JSON object with a key for each script type.`
        },
        {
          role: 'user',
          content: [
            `Script types: ${scriptTypes.join(', ')}`,
            userPrompt
          ].join('\n')
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
      functions: [
        {
          name: 'generate_scripts',
          description: 'Generate video ad scripts for each requested type as a JSON object.',
          parameters: {
            type: 'object',
            properties: scriptProperties,
            required: scriptTypes
          }
        }
      ],
      function_call: { name: 'generate_scripts' },
    });

    console.log('Azure OpenAI completion response:', JSON.stringify(completion, null, 2));
    const functionCall = completion.choices[0]?.message?.function_call;
    if (functionCall && functionCall.arguments) {
      try {
        const args = JSON.parse(functionCall.arguments);
        // Validate that all requested script types are present and are strings
        const result: Record<string, string> = {};
        for (const type of scriptTypes) {
          if (typeof args[type] === 'string') {
            result[type] = args[type];
          } else {
            return res.status(500).json({ error: `AI did not return a valid script for type: ${type}` });
          }
        }
        return res.status(200).json({ scripts: result });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse AI function call arguments.' });
      }
    } else {
      return res.status(500).json({ error: 'No function call response from AI.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate scripts', details: error.message })
  }
} 