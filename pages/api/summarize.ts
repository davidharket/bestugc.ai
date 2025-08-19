import type { NextApiRequest, NextApiResponse } from 'next'
import { AzureOpenAI } from 'openai'

const {
  AZURE_OPENAI_ENDPOINT,        // e.g., https://ai-david0274ai059635514133.openai.azure.com/
  AZURE_OPENAI_API_KEY,         // Your Azure OpenAI API key
  AZURE_OPENAI_DEPLOYMENT_NAME, // The name of your deployment, e.g., "gpt-4o"
  AZURE_OPENAI_API_VERSION = '2025-01-01-preview', // The API version from your endpoint details
} = process.env;

// We need to check for these variables to ensure the API call can be made.
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
  // This error will be thrown when the server starts if the variables are not set,
  // preventing the API route from being called with an uninitialized client.
  throw new Error("Azure OpenAI environment variables are not properly configured. Please check your .env.local file for AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME.");
}

const client = new AzureOpenAI({
  endpoint: AZURE_OPENAI_ENDPOINT,
  apiKey: AZURE_OPENAI_API_KEY,
  apiVersion: AZURE_OPENAI_API_VERSION,
  deployment: AZURE_OPENAI_DEPLOYMENT_NAME, // The deployment name is passed here
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Type guard to ensure the environment variable is available and satisfies the model type.
  if (!AZURE_OPENAI_DEPLOYMENT_NAME) {
    console.error('Azure OpenAI Deployment Name is not configured.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const { text } = req.body
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' })
  }

  // Intelligent text truncation for large content
  const truncateIntelligently = (content: string, maxLength: number = 50000): string => {
    if (content.length <= maxLength) return content;
    
    // Try to find a good breaking point (end of sentence, paragraph, etc.)
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastParagraph = truncated.lastIndexOf('\n\n');
    
    // Use the best breaking point available
    if (lastParagraph > maxLength * 0.8) {
      return content.substring(0, lastParagraph);
    } else if (lastSentence > maxLength * 0.7) {
      return content.substring(0, lastSentence + 1);
    } else {
      // Fall back to word boundary
      const lastSpace = truncated.lastIndexOf(' ');
      return content.substring(0, lastSpace > maxLength * 0.9 ? lastSpace : maxLength);
    }
  };

  const processedText = truncateIntelligently(text);

  try {
    const completion = await client.chat.completions.create({
      // The `model` property is required by the SDK's type definitions.
      // Its value should be the deployment name, which is now guaranteed to be a string.
      model: AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { role: 'system', content: 'Provide an accurate and factual summary of the following product information. Focus on describing the product and its features clearly and objectively. Do not use sales language, persuasion, or emojis. End with a complete sentence. If the content appears truncated, focus on the most relevant product details available.' },
        { role: 'user', content: processedText },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })
    const summary = completion.choices[0]?.message?.content || ''
    res.status(200).json({ summary })
  } catch (error: any) {
    console.error('Azure OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to summarize with Azure OpenAI', details: error.message })
  }
} 