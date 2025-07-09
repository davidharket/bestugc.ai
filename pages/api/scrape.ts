// pages/api/scrape.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import crypto from 'crypto';
import { imageSize } from 'image-size';
import { spawn } from 'child_process';

// --- Re-encode video function remains the same ---
const reencodeVideo = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Re-encoding video: ${inputPath} to ${outputPath}`);
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', inputPath, '-c:v', 'libx264', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', outputPath,
    ]);
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        resolve();
      } else {
        if (fs.existsSync(inputPath)) fs.renameSync(inputPath, outputPath);
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
    ffmpegProcess.on('error', (err) => {
      if (fs.existsSync(inputPath)) fs.renameSync(inputPath, outputPath);
      reject(err);
    });
  });
};

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const getFileExtension = (url: string): string => {
  try {
    return path.extname(new URL(url).pathname) || '.jpg';
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

    $('script, style, noscript, iframe, header, footer, nav, aside').remove();
    const cleanedText = ($('article, main, .product-description, .product-info, .content').first().text() || $('body').text()).replace(/\s+/g, ' ').trim();
    const rawProductName = $('h1').first().text().trim() || $('title').first().text().trim();

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
                    
                    // ✅ THE ONLY CHANGE NEEDED: Prefix the URL with the correct API route
                    downloadedImages.push(`/api/serve-scraped-asset/${scrapeId}/${filename}`);
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

          const tempFilename = `temp_${crypto.randomBytes(6).toString('hex')}.mp4`;
          const finalFilename = `${crypto.randomBytes(6).toString('hex')}.mp4`;
          const tempPath = path.join(baseUploadPath, tempFilename);
          const finalPath = path.join(baseUploadPath, finalFilename);

          const videoResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 30000 });
          fs.writeFileSync(tempPath, videoResponse.data);

          await reencodeVideo(tempPath, finalPath);
          downloadedVideos.push(`/uploads/scraped/${scrapeId}/${finalFilename}`);
        } catch (vidError) { console.error(`Failed to process video ${src}:`, vidError); }
      }
    }).get();
    await Promise.all(videoPromises);

    res.status(200).json({ 
      text: cleanedText,
      images: downloadedImages, // This now contains the correct URLs
      videos: downloadedVideos,
      productName: rawProductName, // Using raw name for simplicity and stability
    });

  } catch (error: any) {
    console.error('Scraping failed:', error.message);
    res.status(500).json({ error: 'Failed to scrape page', details: error.message });
  }
}
