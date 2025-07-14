import type { NextApiRequest, NextApiResponse } from 'next'
import { AzureOpenAI } from 'openai'

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
})

const systemPrompts: Record<string, (duration?: number, language?: string) => string> = {
  cta: (duration, language) => `Write a short, engaging video ad script in ${getLanguageName(language)} from the perspective of a real user who has discovered and loves this product. Speak naturally and conversationally, as if you're recommending it to a friend. Focus on genuine benefits and end with a clear call to action. The script must be suitable for text-to-speech (plain text only, no markdown, no formatting, no bold, no asterisks). Write currency amounts in full words (e.g., "100 kroner" not "kr100", "50 dollars" not "$50"). Avoid symbols like ™, ®, or special characters. For better pronunciation, write model numbers and codes by separating each character with dashes (e.g., "X-218" becomes "X-2-1-8", "GPS-5000" becomes "G-P-S-5-0-0-0"). The script should fit approximately ${duration || 30} seconds. Write the ENTIRE script in ${getLanguageName(language)}.`,
  lifestyle: (duration, language) => `Write a video ad script in ${getLanguageName(language)} from the perspective of someone who has integrated this product into their daily life. Tell a personal story about how this product has improved your routine or solved a problem you had. Be authentic and relatable, speaking as a real person would. The script must be suitable for text-to-speech (plain text only, no markdown, no formatting, no bold, no asterisks). Write currency amounts in full words (e.g., "100 kroner" not "kr100", "50 dollars" not "$50"). Avoid symbols like ™, ®, or special characters. For better pronunciation, write model numbers and codes by separating each character with dashes (e.g., "X-218" becomes "X-2-1-8", "GPS-5000" becomes "G-P-S-5-0-0-0"). The script should fit approximately ${duration || 30} seconds. Write the ENTIRE script in ${getLanguageName(language)}.`,
  brand: (duration, language) => `Write a video ad script in ${getLanguageName(language)} from the perspective of someone who genuinely connects with this brand's values and story. Share why this brand resonates with you personally and emotionally. Speak naturally and authentically about what makes this brand special to you. The script must be suitable for text-to-speech (plain text only, no markdown, no formatting, no bold, no asterisks). Write currency amounts in full words (e.g., "100 kroner" not "kr100", "50 dollars" not "$50"). Avoid symbols like ™, ®, or special characters. For better pronunciation, write model numbers and codes by separating each character with dashes (e.g., "X-218" becomes "X-2-1-8", "GPS-5000" becomes "G-P-S-5-0-0-0"). The script should fit approximately ${duration || 30} seconds. Write the ENTIRE script in ${getLanguageName(language)}.`,
  trending: (duration, language) => `Write a fun, viral-style video ad script in ${getLanguageName(language)} from the perspective of someone who's genuinely excited about this product. Use current trends or popular references naturally, but speak like a real person would - not like a TV advertiser. Be authentic and relatable while being entertaining. The script must be suitable for text-to-speech (plain text only, no markdown, no formatting, no bold, no asterisks). Write currency amounts in full words (e.g., "100 kroner" not "kr100", "50 dollars" not "$50"). Avoid symbols like ™, ®, or special characters. For better pronunciation, write model numbers and codes by separating each character with dashes (e.g., "X-218" becomes "X-2-1-8", "GPS-5000" becomes "G-P-S-5-0-0-0"). The script should fit approximately ${duration || 30} seconds. Write the ENTIRE script in ${getLanguageName(language)}.`,
  custom: (duration, language) => `Write a custom video ad script in ${getLanguageName(language)} from the perspective of a real user who has personal experience with this product. Based on the provided details, create an authentic, conversational script that feels like genuine user-generated content. Speak naturally as if you're sharing your honest experience with a friend. The script must be suitable for text-to-speech (plain text only, no markdown, no formatting, no bold, no asterisks). Write currency amounts in full words (e.g., "100 kroner" not "kr100", "50 dollars" not "$50"). Avoid symbols like ™, ®, or special characters. For better pronunciation, write model numbers and codes by separating each character with dashes (e.g., "X-218" becomes "X-2-1-8", "GPS-5000" becomes "G-P-S-5-0-0-0"). The script should fit approximately ${duration || 30} seconds. Write the ENTIRE script in ${getLanguageName(language)}.`,
}

function getLanguageName(languageCode?: string): string {
  const languageMap: Record<string, string> = {
    'no': 'Norwegian',
    'da': 'Danish', 
    'sv': 'Swedish',
    'en': 'English'
  };
  return languageMap[languageCode || 'en'] || 'English';
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
  
  // Always specify the language explicitly
  const targetLanguage = getLanguageName(language || 'en');
  userPrompt += `\n\nIMPORTANT: Write the script in ${targetLanguage}. The entire script must be in ${targetLanguage}. Write from the perspective of a real user, not a TV advertiser. Use natural, conversational language. Write currency amounts in full words (e.g., "100 kroner" not "kr100"). Avoid symbols like ™, ®, or special characters. For better pronunciation, write model numbers and codes by separating each character with dashes (e.g., "X-218" becomes "X-2-1-8", "GPS-5000" becomes "G-P-S-5-0-0-0").`;

  // Compose the function schema for structured output
  const scriptProperties: Record<string, any> = {};
  for (const type of scriptTypes) {
    scriptProperties[type] = {
      type: 'string',
      description: `The ${type} video ad script written in ${targetLanguage}.`
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating authentic, user-generated video ad scripts in multiple languages. Write from the perspective of real users, not TV advertisers. You MUST use the function call to return your answer. Do NOT write any text outside the function call. For each script type, generate a script as described. Each script must be suitable for text-to-speech (plain text only, no markdown, no formatting, no bold, no asterisks). Write currency amounts in full words (e.g., "100 kroner" not "kr100", "50 dollars" not "$50"). Avoid symbols like ™, ®, or special characters. Each script should fit approximately ${duration || 30} seconds. Write ALL scripts in ${getLanguageName(language || 'en')}. Return the result as a JSON object with a key for each script type.`
        },
        {
          role: 'user',
          content: [
            `Script types: ${scriptTypes.join(', ')}`,
            userPrompt,
            `\nRemember: Write all scripts in ${getLanguageName(language || 'en')}.`
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