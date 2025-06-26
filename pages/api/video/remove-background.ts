// pages/api/video/remove-background.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- Test Script Authentication ---
  if (
    process.env.NODE_ENV === 'development' &&
    req.headers['x-test-secret'] !== process.env.TEST_SECRET_KEY
  ) {
    return res.status(401).json({ error: 'Unauthorized: Invalid test secret' });
  }
  // --- End Authentication ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- MODIFIED: Accept either a URL or a local file path ---
  const { videoUrl, localVideoPath } = req.body;
  if (!videoUrl && !localVideoPath) {
    return res.status(400).json({ error: 'Either videoUrl or localVideoPath is required.' });
  }

  const startTime = Date.now();
  const sourceIdentifier = localVideoPath || videoUrl;
  console.log(`🎭 Background removal started (CPU mode - be patient)`);

  try {
    const sourceHash = crypto.createHash('sha256').update(sourceIdentifier).digest('hex').slice(0, 12);
    const outputFilename = `cutout-${sourceHash}.webm`;
    const outputPath = path.join(process.cwd(), 'public', 'cutouts', outputFilename);
    const cutoutsDir = path.dirname(outputPath);
    if (!fs.existsSync(cutoutsDir)) {
      fs.mkdirSync(cutoutsDir, { recursive: true });
    }

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log("🗑️ Cleared cached cutout");
    }
    
    console.log(`🔄 Processing with robust background removal...`);
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 'remove_background_robust.py');
    
    // Pass the source (either URL or local path) to the Python script
    const pythonProcess = spawn('python', [pythonScriptPath, sourceIdentifier, outputPath]);

    // Reduced logging - only show important progress updates
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('Step ') || output.includes('SUCCESS') || output.includes('ERROR') || output.includes('Processing frame')) {
        console.log(`[BG Removal]: ${output}`);
      }
    });
    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error.length > 0) {
        console.error(`[BG Error]: ${error}`);
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        reject(new Error('Background removal process timed out after 60 minutes.'));
      }, 3600000); // 60 minutes for CPU processing

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve();
        } else {
          reject(new Error(`Python process exited with code ${code}. Check logs for details.`));
        }
      });
      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const processingTime = Date.now() - startTime;
    const fileStats = fs.statSync(outputPath);
    const fileSizeMB = Math.round(fileStats.size / (1024 * 1024) * 100) / 100;
    
    console.log(`✅ Background removal completed in ${processingTime}ms`);
    res.status(200).json({ 
      cutoutVideoUrl: `/cutouts/${outputFilename}`,
      processingTimeMs: processingTime,
      fileSizeMB: fileSizeMB,
      cached: false
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Background removal API failed after ${processingTime}ms:`, error.message);
    res.status(500).json({ 
      error: 'Background removal failed', 
      details: error.message,
      processingTimeMs: processingTime
    });
  }
}