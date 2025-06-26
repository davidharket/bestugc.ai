// pages/api/scrape.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import crypto from 'crypto';
import { imageSize } from 'image-size';
import { spawn } from 'child_process'; // Import spawn for ffmpeg

// --- NEW FUNCTION: Re-encode video to be web-compatible ---
const reencodeVideo = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Re-encoding video: ${inputPath} to ${outputPath}`);
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', inputPath,
      '-c:v', 'libx264',    // The most compatible video codec
      '-preset', 'fast',     // A good balance of speed and quality
      '-pix_fmt', 'yuv420p',  // The most compatible pixel format
      '-movflags', '+faststart', // Important for web streaming
      '-y',                  // Overwrite output file if it exists
      outputPath,
    ]);

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Re-encoding successful: ${outputPath}`);
        fs.unlinkSync(inputPath); // Delete the original, non-standard file
        resolve();
      } else {
        console.error(`❌ FFmpeg failed with code ${code} for file ${inputPath}`);
        // If ffmpeg fails, we'll just use the original file and hope for the best
        fs.renameSync(inputPath, outputPath); // Rename original to the final path
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error(`❌ FFmpeg spawn error for file ${inputPath}:`, err);
      fs.renameSync(inputPath, outputPath);
      reject(err);
    });
  });
};
// --- END NEW FUNCTION ---

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getFileExtension = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || '.jpg';
  } catch {
    return '.jpg';
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url: pageUrl } = req.body;
  if (!pageUrl || typeof pageUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }

  try {
    const { data: html } = await axios.get(pageUrl, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
    });
    const $ = cheerio.load(html);

    // Extract text content and raw product name
    $('script, style, noscript, iframe, header, footer, nav, aside').remove();
    let mainContentText = $('article, main, .product-description, .product-info, .content').first().text() || $('body').text();
    const cleanedText = mainContentText.replace(/\s+/g, ' ').trim();
    let rawProductName = $('h1').first().text().trim() || $('title').first().text().trim();

    const scrapeId = crypto.randomBytes(8).toString('hex');
    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads', 'scraped', scrapeId);
    ensureDirExists(baseUploadPath);

    const downloadedImages: string[] = [];
    const processedUrls = new Set<string>();

    const imagePromises = $('img').map(async (_, el) => {
        const src = $(el).attr('src');
        if (src && (src.startsWith('http') || src.startsWith('/'))) {
            try {
                const absoluteSrc = new URL(src, pageUrl).toString();
                if (processedUrls.has(absoluteSrc)) return;
                processedUrls.add(absoluteSrc);

                const imageResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 15000 });
                const dimensions = imageSize(imageResponse.data);

                if (dimensions.width && dimensions.width >= 100) {
                    const filename = `${crypto.randomBytes(6).toString('hex')}${getFileExtension(absoluteSrc)}`;
                    fs.writeFileSync(path.join(baseUploadPath, filename), imageResponse.data);
                    downloadedImages.push(`/uploads/scraped/${scrapeId}/${filename}`);
                }
            } catch (imgError) { /* ignore image errors */ }
        }
    }).get();

    await Promise.all(imagePromises);

    const downloadedVideos: string[] = [];
    const videoPromises = $('video source[src], video[src]').map(async (_, el) => {
      let src = $(el).attr('src');
      if (src && (src.startsWith('http') || src.startsWith('/'))) {
        try {
          const absoluteSrc = new URL(src, pageUrl).toString();
          if (processedUrls.has(absoluteSrc)) return;
          processedUrls.add(absoluteSrc);

          const extension = getFileExtension(absoluteSrc) || '.mp4';
          const tempFilename = `temp_${crypto.randomBytes(6).toString('hex')}${extension}`;
          const finalFilename = `${crypto.randomBytes(6).toString('hex')}.mp4`; // Always output as .mp4
          
          const tempPath = path.join(baseUploadPath, tempFilename);
          const finalPath = path.join(baseUploadPath, finalFilename);

          const videoResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 30000 });
          fs.writeFileSync(tempPath, videoResponse.data);

          // --- MODIFICATION: Re-encode the video after downloading ---
          await reencodeVideo(tempPath, finalPath);
          // --- END MODIFICATION ---

          downloadedVideos.push(`/uploads/scraped/${scrapeId}/${finalFilename}`);
        } catch (vidError) {
          console.error(`Failed to process video ${src}:`, vidError);
        }
      }
    }).get();

    await Promise.all(videoPromises);

    // Generate AI-powered product name
    let aiProductName = rawProductName; // Fallback to raw product name
    try {
      if (cleanedText && cleanedText.length > 50) { // Only call AI if we have substantial content
        const aiResponse = await axios.post(`${req.headers.origin || '***REMOVED***'}/api/ai/generate-product-name`, {
          scrapedText: cleanedText,
          rawProductName: rawProductName,
          productUrl: pageUrl
        });
        aiProductName = aiResponse.data.productName || rawProductName;
      }
    } catch (aiError) {
      console.error('Failed to generate AI product name:', aiError);
      // Fallback to raw product name if AI fails
    }

    res.status(200).json({ 
      text: cleanedText, 
      images: downloadedImages, 
      videos: downloadedVideos, 
      scrapeId, 
      productName: aiProductName,
      rawProductName: rawProductName
    });

  } catch (error: any) {
    console.error('Scraping failed:', error.message);
    res.status(500).json({ error: 'Failed to scrape page', details: error.message });
  }
}