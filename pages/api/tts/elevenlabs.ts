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

// Strategy: Use v2.5 models by default for all languages
// - eleven_flash_v2_5: Ultra-low latency (~75ms), supports 32 languages
// - eleven_turbo_v2_5: Balanced speed/quality
// - These models provide better multilingual support than older versions

// Norwegian voice collections - all voices confirmed as Norwegian
const NORWEGIAN_VOICES = {
  female: [
    'uNsWM1StCcpydKYOjKyu', // Norwegian female voice 1
    'b3jcIbyC3BSnaRu8avEk'  // Norwegian female voice 2 (Emma - Bergen dialect)
  ],
  male: [
    '9pRpxWU0T7UFt2oEMH6n', // Norwegian male voice 1
    'dgrgQcxISbZtq517iweJ', // Norwegian male voice 2
    '2dhHLsmg0MVma2t041qT', // Norwegian male voice 3
    'xF681s0UeE04gsf0mVsJ'  // Norwegian male voice 4
  ]
};

// Voice mapping based on language and gender
function getVoiceId(language: string, gender: string): string {
  // Norwegian voices - randomly select from the appropriate gender array
  if (language === 'no' && gender === 'female') {
    const femaleVoices = NORWEGIAN_VOICES.female;
    return femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
  }
  
  if (language === 'no' && gender === 'male') {
    const maleVoices = NORWEGIAN_VOICES.male;
    return maleVoices[Math.floor(Math.random() * maleVoices.length)];
  }
  
  // Default to female Norwegian if language is Norwegian but gender not specified
  if (language === 'no') {
    const femaleVoices = NORWEGIAN_VOICES.female;
    return femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
  }
  
  // For non-Norwegian languages, use ElevenLabs default voices
  // These work well with v2.5 models for multiple languages
  if (gender === 'female') {
    return '21m00Tcm4TlvDq8ikWAM'; // Rachel - good multilingual voice
  }
  
  if (gender === 'male') {
    return 'pNInz6obpgDQGcFmaJgB'; // Adam - good multilingual voice
  }
  
  // Default voice for other combinations
  return DEFAULT_VOICE_ID;
}

// Get the appropriate model - prefer v2.5 models for all languages
function getModelId(language: string): string {
  // Use v2.5 models by default for better quality and performance
  // Flash v2.5 supports 32 languages including Norwegian, English, etc.
  return 'eleven_flash_v2_5';
  
  // Alternative: Use turbo v2.5 for balanced speed/quality
  // return 'eleven_turbo_v2_5';
  
  // Fallback to multilingual v2 only if v2.5 models don't work
  // return 'eleven_multilingual_v2';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language, gender, voiceId: providedVoiceId } = req.body;

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

  // Use provided voice ID, or determine based on language and gender, or use default
  const voiceId = providedVoiceId || getVoiceId(language || 'en', gender || 'female');
  const modelId = getModelId(language || 'en');

  console.log(`Using voice ID: ${voiceId} for language: ${language}, gender: ${gender}`);
  console.log(`Using model: ${modelId} (v2.5 optimized for quality and performance)`);

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
    
    try {
      await fs.promises.writeFile(filePath, audioBuffer);
      // Verify the file was written correctly
      const stats = await fs.promises.stat(filePath);
      if (stats.size === 0) {
        throw new Error('Generated audio file is empty');
      }
      console.log(`Audio file saved successfully: ${filePath} (${stats.size} bytes)`);
    } catch (error: any) {
      console.error('Failed to save audio file:', error);
      return res.status(500).json({ 
        error: 'Failed to save generated audio file', 
        details: error.message 
      });
    }

    const audioUrl = `/generated_audio/${fileName}`;
    res.status(200).json({ 
      audioUrl,
      voiceUsed: voiceId,
      modelUsed: modelId,
      language: language,
      gender: gender
    });

  } catch (error: any) {
    console.error('ElevenLabs API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate speech via ElevenLabs', 
      details: error.response?.data || error.message 
    });
  }
}