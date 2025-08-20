// pages/api/tts/elevenlabs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getNorwegianVoiceId, getDutchVoiceId, getDanishVoiceId, getSwedishVoiceId, getEnglishVoiceId, getAvatarGender } from '../../../lib/avatars';
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
  female: ['SXBL9NbvTrjsJQYay2kT'], // Only working voice with Dutch special characters
  male: ['wqDY19Brqhu7UCoLadPh', 'ARIOBKJtltx2F7r1TMzI', 'h6uBOiAjLKklte8hdYio']
};

const ENGLISH_VOICES = {
  female: ['jqcCZkN6Knx8BJ5TBdYR', 'lqydY2xVUkg9cEIFmFMU', 'zGjIP4SZlMnY9m93k97r', 'wJqPPQ618aTW29mptyoc', 'Qggl4b0xRMiqOwhPtVWT'],
  male: ['s3TPKV1kjDlVtZbl4Ksh', 'oTQK6KgOJHp8UGGZjwUu', 'C1npRmjB19a6yNkEucvx', 'ashjVK50jp28G73AUTnb', 'G7ILShrCNLfmS0A37SXS', 'xTZlmU8dKXdyk4XGYGFg', 'yl2ZDV1MzN4HbQJbMihG']
};

function getVoiceId(language: string, gender: string, avatarId?: number): string {
  // Convert fantasy gender to appropriate gender for voice selection
  const actualGender = avatarId ? getAvatarGender(avatarId) : gender;
  console.log(`[TTS] Original gender: ${gender}, Avatar ID: ${avatarId}, Final gender: ${actualGender}`);
  
  // Try to use specific voice mapping for this avatar first
  if (avatarId) {
    let specificVoiceId: string | undefined;
    
    switch (language) {
      case 'no':
        specificVoiceId = getNorwegianVoiceId(avatarId);
        break;
      case 'da':
        specificVoiceId = getDanishVoiceId(avatarId);
        break;
      case 'sv':
        specificVoiceId = getSwedishVoiceId(avatarId);
        break;
      case 'nl':
        specificVoiceId = getDutchVoiceId(avatarId);
        break;
      case 'en':
        specificVoiceId = getEnglishVoiceId(avatarId);
        break;
    }
    
    if (specificVoiceId) {
      console.log(`[TTS] Using mapped ${language} voice ${specificVoiceId} for avatar ${avatarId}`);
      return specificVoiceId;
    }
  }
  
  // Fall back to random voice selection based on gender
  if (language === 'no') {
    const voices = actualGender === 'male' ? NORWEGIAN_VOICES.male : NORWEGIAN_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  if (language === 'da') {
    const voices = actualGender === 'male' ? DANISH_VOICES.male : DANISH_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  if (language === 'sv') {
    const voices = actualGender === 'male' ? SWEDISH_VOICES.male : SWEDISH_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  if (language === 'nl') {
    const voices = actualGender === 'male' ? DUTCH_VOICES.male : DUTCH_VOICES.female;
    return voices[Math.floor(Math.random() * voices.length)];
  }
  // Default to English voices
  const voices = actualGender === 'male' ? ENGLISH_VOICES.male : ENGLISH_VOICES.female;
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
  console.log(`[TTS] Text to synthesize: "${text}" (length: ${text.length} chars)`);
  
  // Debug character encoding
  console.log(`[TTS] Text bytes: ${Buffer.from(text, 'utf8').length} bytes`);
  console.log(`[TTS] Special chars detected: ${/[^\x00-\x7F]/.test(text) ? 'YES' : 'NO'}`);
  if (/[^\x00-\x7F]/.test(text)) {
    const specialChars = text.match(/[^\x00-\x7F]/g);
    console.log(`[TTS] Special characters found: ${JSON.stringify(specialChars)}`);
  }

  try {
    const startTime = Date.now();
    
    // Use timestamps endpoint if requested, otherwise use regular endpoint
    const endpoint = withTimestamps 
      ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`
      : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    console.log(`[TTS] Endpoint: ${endpoint}`);

    // Ensure proper JSON encoding for special characters
    const requestPayload = { 
      text, 
      model_id: modelId, 
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.2 } 
    };
    const requestData = JSON.stringify(requestPayload);
    
    console.log(`[TTS] Request payload size: ${requestData.length} bytes`);
    console.log(`[TTS] JSON serialized text preview: ${requestData.substring(0, 200)}...`);
    
    const response = await axios.post(
      endpoint,
      requestData,
      {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8', 
          'xi-api-key': ELEVENLABS_API_KEY, 
          'Accept': withTimestamps ? 'application/json' : 'audio/mpeg' 
        },
        responseType: withTimestamps ? 'json' : 'arraybuffer',
      }
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[TTS] API Response time: ${responseTime}ms`);
    console.log(`[TTS] Response status: ${response.status} ${response.statusText}`);
    console.log(`[TTS] Response headers: ${JSON.stringify(response.headers)}`);
    console.log(`[TTS] Response data type: ${typeof response.data}, size: ${response.data?.length || response.data?.byteLength || 'unknown'}`);
    
    if (response.status !== 200) {
      console.log(`[TTS] Non-200 response: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    let audioBuffer: Buffer;
    let wordTimings: any[] | undefined;

    if (withTimestamps) {
      console.log(`[TTS] Processing timestamps response`);
      console.log(`[TTS] Response data keys: ${JSON.stringify(Object.keys(response.data))}`);
      
      // Validate timestamps response structure
      if (!response.data.audio_base64) {
        throw new Error('Missing audio_base64 in timestamps response');
      }
      
      if (!response.data.alignment) {
        throw new Error('Missing alignment data in timestamps response');
      }
      
      console.log(`[TTS] Base64 audio data length: ${response.data.audio_base64.length} characters`);
      console.log(`[TTS] Base64 preview: ${response.data.audio_base64.substring(0, 50)}...`);
      
      try {
        // Handle timestamps response
        audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
        console.log(`[TTS] Decoded base64 audio buffer: ${audioBuffer.length} bytes`);
        
        if (audioBuffer.length < 1000) {
          console.warn(`[TTS] WARNING: Suspiciously small audio buffer from base64 decode: ${audioBuffer.length} bytes`);
          console.log(`[TTS] Full base64 data: ${response.data.audio_base64}`);
        }
      } catch (base64Error: any) {
        console.error(`[TTS] Base64 decode error: ${base64Error.message}`);
        throw new Error(`Failed to decode base64 audio: ${base64Error.message}`);
      }
      
      // Convert character-level alignment to word-level timings
      const alignment = response.data.alignment;
      console.log(`[TTS] Alignment data: ${JSON.stringify(alignment)}`);
      
      try {
        wordTimings = convertCharacterToWordTimings(text, alignment);
        console.log(`[TTS] Generated ${wordTimings.length} word timings`);
      } catch (alignmentError: any) {
        console.error(`[TTS] Alignment processing error: ${alignmentError.message}`);
        // Continue without word timings rather than failing
        wordTimings = [];
      }
    } else {
      console.log(`[TTS] Processing regular audio response`);
      // Handle regular audio response
      audioBuffer = Buffer.from(response.data);
      console.log(`[TTS] Audio buffer size: ${audioBuffer.length} bytes`);
    }

    const fileName = `tts_${crypto.randomBytes(8).toString('hex')}.mp3`;
    const outputDir = path.join(process.cwd(), 'public', 'generated_audio');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, fileName);

    console.log(`[TTS] Writing audio to: ${filePath}`);
    await fs.promises.writeFile(filePath, audioBuffer);

    const fileStats = fs.statSync(filePath);
    console.log(`[TTS] File written successfully: ${fileStats.size} bytes`);
    
    if (fileStats.size === 0) {
      console.error(`[TTS] ERROR: Generated audio file is empty!`);
      throw new Error('Generated audio file is empty');
    }
    
    if (fileStats.size < 1000) {
      console.warn(`[TTS] WARNING: Generated audio file is very small (${fileStats.size} bytes) - may be problematic`);
    }

    const audioUrl = `/generated_audio/${fileName}`;
    const responseData: any = { audioUrl, voiceUsed: voiceId, modelUsed: modelId };
    
    console.log(`[TTS] Success: Generated ${fileName} (${fileStats.size} bytes) with voice ${voiceId}`);
    
    if (wordTimings) {
      responseData.wordTimings = wordTimings;
    }
    
    // Rate limiting removed - TTS cache service handles deduplication
    
    res.status(200).json(responseData);

  } catch (error: any) {
    console.error(`[TTS] ERROR occurred during TTS processing`);
    console.error(`[TTS] Error type: ${error.constructor.name}`);
    console.error(`[TTS] Error message: ${error.message}`);
    
    if (error.response) {
      console.error(`[TTS] HTTP Error - Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`[TTS] Response headers: ${JSON.stringify(error.response.headers)}`);
      console.error(`[TTS] Response data type: ${typeof error.response.data}`);
      
      let errorMessage;
      if (error.response.data) {
        if (Buffer.isBuffer(error.response.data)) {
          errorMessage = new TextDecoder().decode(error.response.data);
        } else if (typeof error.response.data === 'object') {
          errorMessage = JSON.stringify(error.response.data);
        } else {
          errorMessage = String(error.response.data);
        }
      } else {
        errorMessage = error.message;
      }
      
      console.error(`[TTS] Parsed error message: ${errorMessage}`);
    } else if (error.request) {
      console.error(`[TTS] Network Error - No response received`);
      console.error(`[TTS] Request config: ${JSON.stringify(error.config)}`);
    } else {
      console.error(`[TTS] General Error: ${error.message}`);
    }
    
    const errorMessage = error.response?.data ? new TextDecoder().decode(error.response.data) : error.message;
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
