// pages/api/video/remove-background.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- ROBUST SECURITY CHECK ---
  const internalSecret = process.env.INTERNAL_SECRET_KEY;
  if (!internalSecret || req.headers['x-internal-secret'] !== internalSecret) {
    if (process.env.NODE_ENV !== 'development' || req.headers['x-test-secret'] !== process.env.TEST_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoUrl, localVideoPath, fps } = req.body;
  if (!videoUrl && !localVideoPath) {
    return res.status(400).json({ error: 'Either videoUrl or localVideoPath is required.' });
  }
  
  const targetFps = fps || 30; // Default to 30 if not specified

  const startTime = Date.now();
  const sourceIdentifier = localVideoPath || videoUrl;
  console.log(`[BG-REMOVAL] 🎭 Process started for: ${sourceIdentifier}`);

  try {
    let processedSourcePath = sourceIdentifier;
    if (localVideoPath && !localVideoPath.startsWith('http')) {
      if (localVideoPath.startsWith('/')) {
        processedSourcePath = path.join(process.cwd(), 'public', localVideoPath);
      } else {
        processedSourcePath = localVideoPath;
      }
    }

    if (!processedSourcePath.startsWith('http') && !fs.existsSync(processedSourcePath)) {
      throw new Error(`Local video file not found: ${processedSourcePath}`);
    }

    const sourceHash = crypto.createHash('sha256').update(sourceIdentifier).digest('hex').slice(0, 12);
    const outputFilename = `cutout-${sourceHash}.webm`;
    const outputPath = path.join(process.cwd(), 'public', 'cutouts', outputFilename);
    const cutoutsDir = path.dirname(outputPath);
    if (!fs.existsSync(cutoutsDir)) fs.mkdirSync(cutoutsDir, { recursive: true });
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    
    // ✅ THE FIX: Point directly to the Python executable inside your virtual environment.
    const pythonExecutable = path.join(process.cwd(), 'venv', 'bin', 'python3');
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 'remove_background_robust.py');
    
    console.log(`[BG-REMOVAL] 🔄 Using Python from venv: ${pythonExecutable}`);
    console.log(`[BG-REMOVAL] 🔄 Processing with robust background removal script at ${targetFps} FPS...`);

    const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, processedSourcePath, outputPath, targetFps.toString()]);

    let lastLog = "";
    pythonProcess.stdout.on('data', (data) => {
      lastLog = data.toString().trim();
      console.log(`[Python Script]: ${lastLog}`);
    });

    let errorLog = "";
    pythonProcess.stderr.on('data', (data) => {
        errorLog += data.toString();
        console.error(`[Python Error]: ${data.toString().trim()}`);
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        reject(new Error('Background removal process timed out after 60 minutes.'));
      }, 3600000);

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve();
        } else {
          reject(new Error(`Python process exited with code ${code}. Last log: "${lastLog}". Error: ${errorLog}`));
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
    
    console.log(`[BG-REMOVAL] ✅ Success! Completed in ${processingTime}ms.`);
    res.status(200).json({ 
      cutoutVideoUrl: `/cutouts/${outputFilename}`,
      processingTimeMs: processingTime,
      fileSizeMB: fileSizeMB,
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[BG-REMOVAL] ❌ API failed after ${processingTime}ms:`, error.message);
    res.status(500).json({ 
      error: 'Background removal failed', 
      details: error.message,
      processingTimeMs: processingTime
    });
  }
}
