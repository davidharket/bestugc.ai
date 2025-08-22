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
import { chromium } from 'playwright';

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

// Screenshot capture function
const captureScreenshots = async (pageUrl: string, uploadPath: string, scrapeId: string): Promise<string[]> => {
  const screenshots: string[] = [];
  let browser = null;
  let configs: any[] = [];
  
  try {
    console.log('[Scraper] Starting screenshot capture...');
    
    // Parse URLs
    const fullUrl = pageUrl.startsWith('http') ? pageUrl : `https://${pageUrl}`;
    const parsedUrl = new URL(fullUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    
    console.log(`[Scraper] Full URL: ${fullUrl}, Base URL: ${baseUrl}`);
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    });
    
    // Screenshot configurations - avoid duplicates when fullUrl equals baseUrl
    const isBaseUrlOnly = fullUrl === baseUrl || fullUrl === `${baseUrl}/`;
    
    if (isBaseUrlOnly) {
      // Only take base screenshots if the provided URL is just the base domain
      configs = [
        { url: baseUrl, viewport: { width: 1200, height: 800 }, filename: 'screenshot-desktop-base.png' },
        { url: baseUrl, viewport: { width: 375, height: 667 }, filename: 'screenshot-mobile-base.png' }
      ];
    } else {
      // Take both full and base screenshots for specific product pages
      configs = [
        { url: fullUrl, viewport: { width: 1200, height: 800 }, filename: 'screenshot-desktop-full.png' },
        { url: fullUrl, viewport: { width: 375, height: 667 }, filename: 'screenshot-mobile-full.png' },
        { url: baseUrl, viewport: { width: 1200, height: 800 }, filename: 'screenshot-desktop-base.png' },
        { url: baseUrl, viewport: { width: 375, height: 667 }, filename: 'screenshot-mobile-base.png' }
      ];
    }
    
    // Capture screenshots
    for (const config of configs) {
      try {
        console.log(`[Scraper] Capturing ${config.filename} for ${config.url}...`);
        
        const page = await context.newPage();
        await page.setViewportSize(config.viewport);
        
        // Navigate with shorter timeout
        await page.goto(config.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
        
        // Wait briefly for dynamic content
        await page.waitForTimeout(1000);
        
        // Take screenshot of viewport only (hero section)
        const screenshotPath = path.join(uploadPath, config.filename);
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: false,
          type: 'png'
        });
        
        await page.close();
        screenshots.push(`/uploads/scraped/${scrapeId}/${config.filename}`);
        console.log(`[Scraper] ✅ Screenshot saved: ${config.filename}`);
        
      } catch (error: any) {
        console.warn(`[Scraper] ⚠️ Failed to capture ${config.filename}: ${error.message}`);
        // Continue with other screenshots even if one fails
      }
    }
    
  } catch (error: any) {
    console.error('[Scraper] Screenshot capture failed:', error.message);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.warn('[Scraper] Failed to close browser:', error);
      }
    }
  }
  
  console.log(`[Scraper] Screenshot capture completed. Captured ${screenshots.length}/${configs.length} screenshots`);
  return screenshots;
};

// Global map to track active scrapes and prevent duplicates
const activeScrapes = new Map<string, Promise<any>>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url: pageUrl } = req.body;
  if (!pageUrl || typeof pageUrl !== 'string') return res.status(400).json({ error: 'Missing or invalid url' });

  // Check if this URL is already being scraped
  if (activeScrapes.has(pageUrl)) {
    console.log(`[Scraper] Duplicate request detected for ${pageUrl}, waiting for existing scrape...`);
    try {
      const result = await activeScrapes.get(pageUrl);
      if (!res.headersSent) {
        res.status(200).json(result);
      }
      return;
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to scrape page', details: error.message });
      }
      return;
    }
  }

  const startTime = Date.now();
  const scrapeTimeout = 90000; // 90 seconds max
  console.log(`[Scraper] Starting scrape for: ${pageUrl}`);

  // Create the scraping promise
  const scrapePromise = performScraping(pageUrl, startTime);
  activeScrapes.set(pageUrl, scrapePromise);

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Scrape timeout after 90 seconds')), scrapeTimeout);
  });

  try {
    // Race the scraping operation against the timeout
    const result = await Promise.race([scrapePromise, timeoutPromise]);
    if (!res.headersSent) {
      res.status(200).json(result);
    }
  } catch (error: any) {
    console.error('[Scraper] Scraping failed:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to scrape page', details: error.message });
    }
  } finally {
    // Clean up the active scrape
    activeScrapes.delete(pageUrl);
  }
}

async function performScraping(pageUrl: string, startTime: number) {
  try {
    const { data: html } = await axios.get(pageUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' } });
    const $ = cheerio.load(html);

    console.log('[Scraper] Extracting text and product name...');
    $('script, style, noscript, iframe, header, footer, nav, aside').remove();
    const cleanedText = ($('article, main, .product-description, .product-info, .content').first().text() || $('body').text()).replace(/\s+/g, ' ').trim();
    const rawProductName = $('h1').first().text().trim() || $('title').first().text().trim();

    const scrapeId = crypto.randomBytes(8).toString('hex');
    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads', 'scraped', scrapeId);
    ensureDirExists(baseUploadPath);

    // Start screenshot capture in parallel with media scraping
    const screenshotPromise = captureScreenshots(pageUrl, baseUploadPath, scrapeId);

    const downloadedImages: string[] = [];
    const downloadedVideos: string[] = [];
    const processedUrls = new Set<string>();
    const imageLimit = 8;
    const videoLimit = 3;
    const maxVideoSize = 20 * 1024 * 1024; // 20MB

    // Process videos first
    console.log('[Scraper] Processing videos...');
    const videoElements = $('video source[src], video[src]').get();
    for (const el of videoElements) {
        if (downloadedVideos.length >= videoLimit) break;
        let src = $(el).attr('src');
        if (src && (src.startsWith('http') || src.startsWith('/'))) {
            try {
                const absoluteSrc = new URL(src, pageUrl).toString();
                if (processedUrls.has(absoluteSrc)) continue;
                processedUrls.add(absoluteSrc);
                
                // Check video size first
                const headResponse = await axios.head(absoluteSrc, { timeout: 5000 });
                const contentLength = parseInt(headResponse.headers['content-length'] || '0');
                if (contentLength > maxVideoSize) {
                    console.log(`[Scraper] Skipping large video (${(contentLength / 1024 / 1024).toFixed(1)}MB): ${src}`);
                    continue;
                }
                
                const tempFilename = `temp_${crypto.randomBytes(6).toString('hex')}.mp4`;
                const finalFilename = `${crypto.randomBytes(6).toString('hex')}.mp4`;
                const tempPath = path.join(baseUploadPath, tempFilename);
                const finalPath = path.join(baseUploadPath, finalFilename);
                const videoResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 15000 });
                fs.writeFileSync(tempPath, videoResponse.data);
                await reencodeVideo(tempPath, finalPath);
                downloadedVideos.push(`/uploads/scraped/${scrapeId}/${finalFilename}`);
                console.log(`[Scraper] Downloaded video ${downloadedVideos.length}/${videoLimit}: ${finalFilename}`);
            } catch (vidError) { 
                console.warn(`[Scraper] Failed to process video ${src}:`, vidError); 
            }
        }
    }

    // Process images after videos
    console.log('[Scraper] Processing images...');
    const imageElements = $('img').get();
    console.log(`[Scraper] Found ${imageElements.length} image elements. Processing up to ${imageLimit}...`);

    // Process images sequentially to avoid counting failed images towards limit
    let processedCount = 0;
    
    for (const el of imageElements) {
      if (downloadedImages.length >= imageLimit) {
        console.log(`[Scraper] Reached image limit (${imageLimit}). Stopping image processing.`);
        break;
      }

      processedCount++;
      if (processedCount > imageElements.length * 0.8) {
        console.log('[Scraper] Processed 80% of images, stopping to avoid excessive processing.');
        break;
      }

      const imageSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
      if (!imageSrc) continue;

      // Skip obvious non-product images
      if (imageSrc.includes('/flags/') || imageSrc.includes('icon') || imageSrc.includes('logo')) {
        console.log(`[Scraper] Skipping non-product image: ${imageSrc}`);
        continue;
      }

      // Log the found image source for debugging
      console.log(`[Scraper] Found image src: ${imageSrc}`);

      try {
        let absoluteSrc: string;
        
        // Handle different URL formats
        if (imageSrc.startsWith('http')) {
          absoluteSrc = imageSrc;
        } else if (imageSrc.startsWith('//')) {
          absoluteSrc = `https:${imageSrc}`;
        } else if (imageSrc.startsWith('/')) {
          const baseUrl = new URL(pageUrl);
          absoluteSrc = `${baseUrl.origin}${imageSrc}`;
        } else {
          // Relative URL
          absoluteSrc = new URL(imageSrc, pageUrl).toString();
        }

        console.log(`[Scraper] Resolved absolute URL: ${absoluteSrc}`);

        if (processedUrls.has(absoluteSrc)) {
          console.log(`[Scraper] Skipping duplicate URL: ${absoluteSrc}`);
          continue;
        }
        processedUrls.add(absoluteSrc);

        const imageResponse = await axios.get(absoluteSrc, { 
          responseType: 'arraybuffer', 
          timeout: 12000,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
          }
        });
        
        // Check if response has actual image data
        if (!imageResponse.data || imageResponse.data.byteLength < 1000) {
          console.log(`[Scraper] Image too small or empty: ${absoluteSrc}`);
          continue; // Continue to next image instead of counting this as processed
        }

        // Relaxed size filter - images smaller than 5KB are likely icons/placeholders
        const contentLength = parseInt(imageResponse.headers['content-length'] || '0') || imageResponse.data.byteLength;
        if (contentLength < 5000) {
          console.log(`[Scraper] Skipping small image (${contentLength} bytes): ${absoluteSrc}`);
          continue; // Continue to next image instead of counting this as processed
        }

        const filename = `${crypto.randomBytes(6).toString('hex')}${getFileExtension(absoluteSrc)}`;
        fs.writeFileSync(path.join(baseUploadPath, filename), imageResponse.data);
        downloadedImages.push(`/uploads/scraped/${scrapeId}/${filename}`);
        console.log(`[Scraper] ✅ Downloaded image ${downloadedImages.length}/${imageLimit}: ${filename} (${contentLength} bytes)`);
        
      } catch (imgError: any) {
        console.warn(`[Scraper] Could not download image from ${imageSrc}: ${imgError.message}`);
        // Don't continue here - network errors shouldn't skip the slot
      }
    }

    // Wait for screenshots to complete
    const screenshots = await screenshotPromise;

    const endTime = Date.now();
    console.log(`[Scraper] Scraping finished in ${(endTime - startTime) / 1000} seconds.`);

    return {
      text: cleanedText,
      images: downloadedImages,
      videos: downloadedVideos,
      screenshots: screenshots,
      productName: rawProductName,
    };

  } catch (error: any) {
    console.error('[Scraper] Scraping failed:', error.message);
    throw error;
  }
}
