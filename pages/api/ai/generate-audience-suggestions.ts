import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing assistant. Based on the following product information, generate 5 distinct target audience suggestions for an ad campaign. Each suggestion should be concise (3-7 words). Return the suggestions as a JSON array of strings. For example: ["Tech-savvy millennials", "Budget-conscious students", "Luxury car owners"]',
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: 150,
      temperature: 0.7,
      // response_format: { type: "json_object" }, // Enable if model and library version support reliable JSON mode
    });

    let suggestions: string[] = [];
    const rawResponse = completion.choices[0]?.message?.content;

    if (rawResponse) {
      try {
        // Attempt to parse the response as JSON array of strings
        const parsed = JSON.parse(rawResponse);
        if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) {
          suggestions = parsed;
        } else {
          // If parsing succeeds but it's not an array of strings, fall back to text processing.
          console.warn('AI response was JSON but not an array of strings, attempting text fallback:', rawResponse);
          // Fallback will be handled below if suggestions is still empty
        }
      } catch (e) {
        // If JSON.parse fails, it means the response is likely plain text.
        // console.warn('Failed to parse AI response as JSON, will attempt text fallback:', rawResponse);
        // Fallback will be handled below
      }

      // If JSON parsing failed or resulted in an incorrect type, try text-based list parsing
      if (suggestions.length === 0) {
        console.log('Attempting text-based list parsing for AI response.');
        suggestions = rawResponse
          .split('\n')
          .map(s => s.replace(/^- |^\* |^\d+\.\s*/, '').trim()) // Remove common list markers (-, *, 1.)
          .filter(s => s.length > 2 && s.length < 70); // Basic filtering for relevance and length
      }
      
      // Ensure we only return up to 5 suggestions if fallback generated more
      suggestions = suggestions.slice(0, 5);
    }
    
    // Final check: if still no suggestions but there was a raw response, split it as a last resort.
    if (suggestions.length === 0 && rawResponse) {
        console.warn('All parsing failed, using raw lines from AI response as a final attempt.');
        suggestions = rawResponse.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s.length < 70).slice(0,5);
    }

    res.status(200).json({ suggestions });

  } catch (error: any) {
    console.error('OpenAI API error (audience suggestions):', error.message);
    res.status(500).json({ error: 'Failed to generate audience suggestions', details: error.message });
  }
} 