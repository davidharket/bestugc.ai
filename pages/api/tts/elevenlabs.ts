// pages/api/tts/elevenlabs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Example: Rachel

const NORWEGIAN_VOICES = {
  female: ['uNsWM1StCcpydKYOjKyu', 'b3jcIbyC3BSnaRu8avEk'],
  male: ['9pRpxWU0T7UFt2oEMH6n', 'dgrgQcxISbZtq517iweJ', '2dhHLsmg0MVma2t041qT', 'xF681s0UeE04gsf0mVsJ', '4kCDY3HJwvO7Zp3con83', 'vUmLiNBm6MDcy1NUHaVr']
};

const ENGLISH_VOICES = {
  female: ['21m00Tcm4TlvDq8ikWAM', 'EXAVITQu4vr4xnSDxMaL'],
  male: ['pNInz6obpgDQGcFmaJgB', '29vD33N1CtxCmqQRPOHJ', 'CYw3kZ02Hs0563khs1Fj', 'JBFqnCBsd6RMkjVDRZzb', 'ZQe5CqHNLjbsabgITWbw', 'bVMeCyTHy58xNoL34h3p']
};

function getVoiceId(language: string, gender: string): string {
  if (language === 'no') {
    const voices = gender === 'male' ? NORWEGIAN_VOICES.male : NORWEGIAN_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  // Default to English voices
  const voices = gender === 'male' ? ENGLISH_VOICES.male : ENGLISH_VOICES.female;
  return voices[Math.floor(Math.random() * voices.length)];
}

function getModelId(language: string): string {
  return 'eleven_flash_v2_5';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- ✅ START: ROBUST SECURITY CHECK ---
  const internalSecret = process.env.INTERNAL_SECRET_KEY;
  const session = await getServerSession(req, res, authOptions);
  
  // Allow internal secret OR authenticated user session
  const isInternalRequest = internalSecret && req.headers['x-internal-secret'] === internalSecret;
  const isAuthenticatedUser = session?.user?.id;
  const isDevMode = process.env.NODE_ENV === 'development' && req.headers['x-test-secret'] === process.env.TEST_SECRET_KEY;
  
  if (!isInternalRequest && !isAuthenticatedUser && !isDevMode) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // --- ✅ END: ROBUST SECURITY CHECK ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language, gender, voiceId: providedVoiceId } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }
  
  // ✅ LOGIC CHANGE: Fail loudly in production if the key is missing.
  if (!ELEVENLABS_API_KEY) {
    console.error('[TTS] ElevenLabs API key not configured.');
    return res.status(500).json({ error: 'Server configuration error: ElevenLabs API key is missing.' });
  }

  const voiceId = providedVoiceId || getVoiceId(language || 'en', gender || 'female');
  const modelId = getModelId(language || 'en');

  console.log(`[TTS] Using voice ID: ${voiceId} for language: ${language || 'en'}`);

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      { text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
      {
        headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY, 'Accept': 'audio/mpeg' },
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

    if (fs.statSync(filePath).size === 0) {
      throw new Error('Generated audio file is empty');
    }

    const audioUrl = `/generated_audio/${fileName}`;
    res.status(200).json({ audioUrl, voiceUsed: voiceId, modelUsed: modelId });

  } catch (error: any) {
    const errorMessage = error.response?.data ? new TextDecoder().decode(error.response.data) : error.message;
    console.error('[TTS] ElevenLabs API error:', errorMessage);
    res.status(500).json({ error: 'Failed to generate speech via ElevenLabs', details: errorMessage });
  }
}
