// pages/api/tts/elevenlabs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getNorwegianVoiceId } from '../../../lib/avatars';
// Rate limiting removed - TTS cache service handles deduplication

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Example: Rachel

const NORWEGIAN_VOICES = {
  female: ['uNsWM1StCcpydKYOjKyu', 'b3jcIbyC3BSnaRu8avEk'],
  male: ['4kCDY3HJwvO7Zp3con83', '2dhHLsmg0MVma2t041qT', 'vUmLiNBm6MDcy1NUHaVr', '9pRpxWU0T7UFt2oEMH6n', 's2xtA7B2CTXPPlJzch1v', 'dgrgQcxISbZtq517iweJ']
};

const DANISH_VOICES = {
  female: ['4RklGmuxoAskAbGXplXN', 'ZKutKtutnlbOxDxkNlhk'],
  male: ['V34B5u5UbLdNJVEkcgXp', 'qhEux886xDKbOdF7jkFP']
};

const SWEDISH_VOICES = {
  female: ['4Ct5uMEndw4cJ7q0Jx0l', 'ydcjeBaRUalXzqZuTB3b', 'aSLKtNoVBZlxQEMsnGL2'],
  male: ['ZMs9a3j1SLzirC7aygJQ', 'e6OiUVixGLmvtdn2GJYE', '7UMEOkIJdI4hjmR2SWNq', 'JhAQDwsLijg4qbxGNQGH']
};

const DUTCH_VOICES = {
  female: ['ANHrhmaFeVN0QJaa0PhL', 'XJa38TJgDqYhj5mYbSJA', 'gC9jy9VUxaXAswovchvQ', 'SXBL9NbvTrjsJQYay2kT'],
  male: ['wqDY19Brqhu7UCoLadPh', 'ARIOBKJtltx2F7r1TMzI', 'h6uBOiAjLKklte8hdYio']
};

const ENGLISH_VOICES = {
  female: ['jqcCZkN6Knx8BJ5TBdYR', 'lqydY2xVUkg9cEIFmFMU', 'zGjIP4SZlMnY9m93k97r', 'wJqPPQ618aTW29mptyoc', 'Qggl4b0xRMiqOwhPtVWT'],
  male: ['s3TPKV1kjDlVtZbl4Ksh', 'oTQK6KgOJHp8UGGZjwUu', 'C1npRmjB19a6yNkEucvx', 'ashjVK50jp28G73AUTnb', 'G7ILShrCNLfmS0A37SXS', 'xTZlmU8dKXdyk4XGYGFg', 'yl2ZDV1MzN4HbQJbMihG']
};

function getVoiceId(language: string, gender: string, avatarId?: number): string {
  if (language === 'no' && avatarId) {
    // Use specific Norwegian voice mapping for this avatar
    const norwegianVoiceId = getNorwegianVoiceId(avatarId);
    if (norwegianVoiceId) {
      console.log(`[TTS] Using mapped Norwegian voice ${norwegianVoiceId} for avatar ${avatarId}`);
      return norwegianVoiceId;
    }
  }
  
  if (language === 'no') {
    const voices = gender === 'male' ? NORWEGIAN_VOICES.male : NORWEGIAN_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  if (language === 'da') {
    const voices = gender === 'male' ? DANISH_VOICES.male : DANISH_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  if (language === 'sv') {
    const voices = gender === 'male' ? SWEDISH_VOICES.male : SWEDISH_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  if (language === 'nl') {
    const voices = gender === 'male' ? DUTCH_VOICES.male : DUTCH_VOICES.female;
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
  
  // Rate limiting removed - TTS cache service ensures only one call per unique content
  // --- ✅ END: ROBUST SECURITY CHECK ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language, gender, voiceId: providedVoiceId, withTimestamps, avatarId } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }
  
  // ✅ LOGIC CHANGE: Fail loudly in production if the key is missing.
  if (!ELEVENLABS_API_KEY) {
    console.error('[TTS] ElevenLabs API key not configured.');
    return res.status(500).json({ error: 'Server configuration error: ElevenLabs API key is missing.' });
  }

  const voiceId = providedVoiceId || getVoiceId(language || 'en', gender || 'female', avatarId);
  const modelId = getModelId(language || 'en');

  console.log(`[TTS] Gender: ${gender || 'female'}, Language: ${language || 'en'}, ProvidedVoiceId: ${providedVoiceId || 'none'}`);
  console.log(`[TTS] Using voice ID: ${voiceId} for language: ${language || 'en'}`);

  try {
    // Use timestamps endpoint if requested, otherwise use regular endpoint
    const endpoint = withTimestamps 
      ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`
      : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      endpoint,
      { text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.2 } },
      {
        headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY, 'Accept': withTimestamps ? 'application/json' : 'audio/mpeg' },
        responseType: withTimestamps ? 'json' : 'arraybuffer',
      }
    );

    let audioBuffer: Buffer;
    let wordTimings: any[] | undefined;

    if (withTimestamps) {
      // Handle timestamps response
      audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
      
      // Convert character-level alignment to word-level timings
      const alignment = response.data.alignment;
      wordTimings = convertCharacterToWordTimings(text, alignment);
    } else {
      // Handle regular audio response
      audioBuffer = Buffer.from(response.data);
    }

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
    const responseData: any = { audioUrl, voiceUsed: voiceId, modelUsed: modelId };
    
    if (wordTimings) {
      responseData.wordTimings = wordTimings;
    }
    
    // Rate limiting removed - TTS cache service handles deduplication
    
    res.status(200).json(responseData);

  } catch (error: any) {
    const errorMessage = error.response?.data ? new TextDecoder().decode(error.response.data) : error.message;
    console.error('[TTS] ElevenLabs API error:', errorMessage);
    res.status(500).json({ error: 'Failed to generate speech via ElevenLabs', details: errorMessage });
  }
}

// Convert character-level alignment to word-level timings
function convertCharacterToWordTimings(text: string, alignment: any): any[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const words = text.split(/\s+/);
  const wordTimings: any[] = [];
  
  let charIndex = 0;
  let currentWordStart = 0;
  
  for (const word of words) {
    // Find the start of this word in the character array
    while (charIndex < characters.length && characters[charIndex] === ' ') {
      charIndex++;
    }
    
    if (charIndex >= characters.length) break;
    
    const wordStartTime = character_start_times_seconds[charIndex];
    
    // Find the end of this word
    const wordEndCharIndex = charIndex + word.length - 1;
    const wordEndTime = wordEndCharIndex < character_end_times_seconds.length 
      ? character_end_times_seconds[wordEndCharIndex] 
      : character_end_times_seconds[character_end_times_seconds.length - 1];
    
    wordTimings.push({
      word: word,
      startTime: wordStartTime,
      endTime: wordEndTime
    });
    
    charIndex += word.length;
  }
  
  return wordTimings;
}
