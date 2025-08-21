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

  // Clean the content to avoid content policy issues
  const cleanContent = (content: string): string => {
    return content
      // Remove potentially problematic URLs and references
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      // Remove email addresses
      .replace(/[^\s]+@[^\s]+\.[^\s]+/g, '[EMAIL]')
      // Remove phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      // Remove excessive special characters that might trigger filters
      .replace(/[^\w\s.,!?()-]/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  const cleanedText = cleanContent(processedText);

  try {
    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional product analyst. Provide a clear, factual summary of product information. Focus only on legitimate business product features and benefits. Use neutral, professional language. Do not use markdown formatting, bullet points, or special characters. Write in plain text paragraphs only.' 
        },
        { 
          role: 'user', 
          content: `Please provide a professional summary of this product information:\n\n${cleanedText}` 
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    })
    const rawSummary = completion.choices[0]?.message?.content || ''
    
    // Remove markdown formatting
    const cleanSummary = rawSummary
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic *text*
      .replace(/#{1,6}\s*/g, '')        // Remove headers
      .replace(/^\s*[-*+]\s+/gm, '')    // Remove bullet points
      .replace(/^\s*\d+\.\s+/gm, '')    // Remove numbered lists
      .replace(/`([^`]+)`/g, '$1')      // Remove code blocks
      .replace(/\n{3,}/g, '\n\n')       // Limit to max 2 newlines
      .trim();
    
    res.status(200).json({ summary: cleanSummary })
  } catch (error: any) {
    console.error('Azure OpenAI Error:', error);
    
    // If content filtering fails, provide a basic fallback
    if (error.code === 'content_filter') {
      const basicSummary = text.substring(0, 200).replace(/[^\w\s.,!?()-]/g, ' ').trim() + '...';
      return res.status(200).json({ 
        summary: basicSummary,
        note: 'Summary generated from basic text processing due to content policy restrictions.'
      });
    }
    
    res.status(500).json({ error: 'Failed to summarize with Azure OpenAI', details: error.message })
  }
} 