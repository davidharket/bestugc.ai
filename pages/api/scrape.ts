// pages/api/scrape.ts

// Comprehensive polyfill for Node.js compatibility - must be first
if (typeof global !== 'undefined') {
  // Polyfill Blob if missing
  if (typeof global.Blob === 'undefined') {
    global.Blob = class Blob {
      constructor(parts: BlobPart[] = [], options: BlobPropertyBag = {}) {
        this.size = 0;
        this.type = options.type || '';
        if (parts) {
          for (const part of parts) {
            if (typeof part === 'string') {
              this.size += Buffer.byteLength(part, 'utf8');
            } else if (part instanceof Buffer) {
              this.size += part.length;
            } else if (part instanceof ArrayBuffer) {
              this.size += part.byteLength;
            }
          }
        }
      }
      size: number;
      type: string;
      async text(): Promise<string> { return ''; }
      async arrayBuffer(): Promise<ArrayBuffer> { return new ArrayBuffer(0); }
      stream(): any { return {}; }
      slice(): Blob { return new Blob(); }
    } as any;
  }

  // Polyfill File constructor
  if (typeof global.File === 'undefined') {
    global.File = class File extends (global.Blob as any) {
      constructor(fileBits: BlobPart[], fileName: string, options: FilePropertyBag = {}) {
        super(fileBits, options);
        this.name = fileName;
        this.lastModified = options.lastModified || Date.now();
        this.webkitRelativePath = '';
      }
      name: string;
      lastModified: number;
      webkitRelativePath: string;
    } as any;
  }

  // Polyfill FormData
  if (typeof global.FormData === 'undefined') {
    global.FormData = class FormData {
      private data = new Map<string, any>();
      append(name: string, value: any): void { this.data.set(name, value); }
      delete(name: string): void { this.data.delete(name); }
      get(name: string): any { return this.data.get(name); }
      getAll(name: string): any[] { return this.data.has(name) ? [this.data.get(name)] : []; }
      has(name: string): boolean { return this.data.has(name); }
      set(name: string, value: any): void { this.data.set(name, value); }
      entries(): IterableIterator<[string, any]> { return this.data.entries(); }
      keys(): IterableIterator<string> { return this.data.keys(); }
      values(): IterableIterator<any> { return this.data.values(); }
      [Symbol.iterator](): IterableIterator<[string, any]> { return this.data.entries(); }
    } as any;
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import crypto from 'crypto';
import { spawn } from 'child_process';
import * as cheerio from 'cheerio';

// Helper functions (no changes)
const reencodeVideo = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve) => {
    const ffmpegProcess = spawn('ffmpeg', ['-i', inputPath, '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', outputPath]);
    ffmpegProcess.on('close', (code) => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (code !== 0) console.warn(`[Scraper] FFmpeg re-encoding failed with code ${code}.`);
      resolve();
    });
    ffmpegProcess.on('error', (err) => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      console.error(`[Scraper] FFmpeg error:`, err);
      resolve();
    });
  });
};
const ensureDirExists = (dirPath: string) => { if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true }); };
const getFileExtension = (url: string): string => { try { return path.extname(new URL(url).pathname).replace(/(\?.*)$/, '') || '.jpg'; } catch { return '.jpg'; }};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url: pageUrl } = req.body;
  if (!pageUrl || typeof pageUrl !== 'string') return res.status(400).json({ error: 'Missing or invalid url' });

  const startTime = Date.now();
  console.log(`[Scraper] Starting axios scrape for: ${pageUrl}`);

  try {
    const { data: html } = await axios.get(pageUrl, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' } });
    const $ = cheerio.load(html);

    console.log('[Scraper] Extracting text and product name...');
    $('script, style, noscript, iframe, header, footer, nav, aside').remove();
    const cleanedText = ($('article, main, .product-description, .product-info, .content').first().text() || $('body').text()).replace(/\s+/g, ' ').trim();
    const rawProductName = $('h1').first().text().trim() || $('title').first().text().trim();

    const scrapeId = crypto.randomBytes(8).toString('hex');
    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads', 'scraped', scrapeId);
    ensureDirExists(baseUploadPath);

    const downloadedImages: string[] = [];
    const processedUrls = new Set<string>();
    const imageLimit = 10;
    const imageElements = $('img').get();
    console.log(`[Scraper] Found ${imageElements.length} image elements. Processing up to ${imageLimit}...`);

    for (const el of imageElements) {
        if (downloadedImages.length >= imageLimit) {
            console.log('[Scraper] Reached image limit. Stopping image processing.');
            break;
        }

        // ✅ THE FIX: Check for lazy-loading attributes first!
        const imageSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');

        if (imageSrc && (imageSrc.startsWith('http') || imageSrc.startsWith('/'))) {
            try {
                const absoluteSrc = new URL(imageSrc, pageUrl).toString();
                if (processedUrls.has(absoluteSrc)) continue;
                processedUrls.add(absoluteSrc);

                const imageResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 30000 });
                if (imageResponse.headers['content-length'] && parseInt(imageResponse.headers['content-length']) < 20000) continue;

                const filename = `${crypto.randomBytes(6).toString('hex')}${getFileExtension(absoluteSrc)}`;
                fs.writeFileSync(path.join(baseUploadPath, filename), imageResponse.data);
                downloadedImages.push(`/uploads/scraped/${scrapeId}/${filename}`);
                console.log(`[Scraper] Downloaded image ${downloadedImages.length}/${imageLimit}: ${filename}`); // ✅ Added success log
            } catch (imgError: any) {
                // ✅ Improved error logging
                console.warn(`[Scraper] Could not download image from ${imageSrc}: ${imgError.message}`);
            }
        }
    }

    // Video scraping logic (no changes needed here, it was already working)
    const downloadedVideos: string[] = [];
    const videoLimit = 3;
    const videoElements = $('video source[src], video[src]').get();
    for (const el of videoElements) {
        if (downloadedVideos.length >= videoLimit) break;
        let src = $(el).attr('src');
        if (src && (src.startsWith('http') || src.startsWith('/'))) {
            try {
                const absoluteSrc = new URL(src, pageUrl).toString();
                if (processedUrls.has(absoluteSrc)) continue;
                processedUrls.add(absoluteSrc);
                const tempFilename = `temp_${crypto.randomBytes(6).toString('hex')}.mp4`;
                const finalFilename = `${crypto.randomBytes(6).toString('hex')}.mp4`;
                const tempPath = path.join(baseUploadPath, tempFilename);
                const finalPath = path.join(baseUploadPath, finalFilename);
                const videoResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 30000 });
                fs.writeFileSync(tempPath, videoResponse.data);
                await reencodeVideo(tempPath, finalPath);
                downloadedVideos.push(`/uploads/scraped/${scrapeId}/${finalFilename}`);
            } catch (vidError) { console.warn(`[Scraper] Failed to process video ${src}:`, vidError); }
        }
    }

    const endTime = Date.now();
    console.log(`[Scraper] Scraping finished in ${(endTime - startTime) / 1000} seconds.`);

    res.status(200).json({ 
      text: cleanedText,
      images: downloadedImages,
      videos: downloadedVideos,
      productName: rawProductName,
    });

  } catch (error: any) {
    console.error('[Scraper] Scraping failed:', error.message);
    res.status(500).json({ error: 'Failed to scrape page', details: error.message });
  }
}
