import type { NextApiRequest, NextApiResponse } from 'next'
// import { ElevenLabsClient } from "elevenlabs"; // Official SDK, if available and preferred
import axios from 'axios'; // Or use the official SDK

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
        model_id: modelId, // e.g., 'eleven_multilingual_v2' or 'eleven_turbo_v2'
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
        // language_code: language, // Some models might take language code directly
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Accept': 'audio/mpeg', // Requesting audio directly
        },
        responseType: 'arraybuffer', // To receive audio data
      }
    );

    // Option 1: Stream audio back (complex for this example, requires changing responseType and handling)
    // Option 2: Save to a file on your server and return the URL (requires fs access and public folder setup)
    // For this example, let's imagine we saved it and got a URL.
    // This part needs actual implementation for saving the file and generating a publicly accessible URL.
    // E.g., save to `public/generated_audio/some_id.mp3` then return `/generated_audio/some_id.mp3`
    
    // const audioBuffer = Buffer.from(response.data);
    // const fileName = `tts_${Date.now()}.mp3`;
    // const filePath = path.join(process.cwd(), 'public', 'generated_audio', fileName);
    // await fs.promises.writeFile(filePath, audioBuffer);
    // const audioUrl = `/generated_audio/${fileName}`;

    // For now, as a placeholder since saving file and managing public URLs is involved:
    // In a real scenario, you would upload this to a bucket or serve it from your file system.
    // The ElevenLabs API might also have options for returning a temporary URL or streaming.
    console.log("ElevenLabs API call successful (simulated actual audio data handling)");
    res.status(200).json({ audioUrl: '/audio/placeholder_tts.mp3' }); // Placeholder URL

  } catch (error: any) {
    console.error('ElevenLabs API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate speech via ElevenLabs', 
      details: error.response?.data || error.message 
    });
  }
} 