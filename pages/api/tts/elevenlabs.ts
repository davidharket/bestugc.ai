import type { NextApiRequest, NextApiResponse } from 'next'
// import { ElevenLabsClient } from "elevenlabs"; // Official SDK, if available and preferred
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// const elevenlabs = new ElevenLabsClient({
//   apiKey: process.env.ELEVENLABS_API_KEY,
// });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// A default voice ID from ElevenLabs, find yours in their Voice Lab
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Example: Rachel

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language, voiceId: providedVoiceId } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not configured.');
    // Simulate a successful response with a placeholder for development if no key
    // In a real scenario, you might want to return an error or handle this differently
    // For now, to allow frontend development, we'll return a placeholder.
    return res.status(200).json({ 
        audioUrl: '/audio/placeholder_tts.mp3', 
        message: 'ElevenLabs API key not found. Returning placeholder audio.'
    });
    // return res.status(500).json({ error: 'ElevenLabs API key not configured.' });
  }

  const voiceId = providedVoiceId || DEFAULT_VOICE_ID;
  const modelId = language === 'en' ? 'eleven_multilingual_v2' : 'eleven_multilingual_v2'; // Or specific mono-lingual models

  try {
    // This is a conceptual example using axios. The actual API structure might differ.
    // Refer to ElevenLabs API documentation for precise details.
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Accept': 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = Buffer.from(response.data);
    const fileName = `tts_${crypto.randomBytes(8).toString('hex')}.mp3`;
    const outputDir = path.join(process.cwd(), 'public', 'generated_audio');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, fileName);
    await fs.promises.writeFile(filePath, audioBuffer);
    const audioUrl = `/generated_audio/${fileName}`;

    res.status(200).json({ audioUrl });

  } catch (error: any) {
    console.error('ElevenLabs API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate speech via ElevenLabs', 
      details: error.response?.data || error.message 
    });
  }
} 