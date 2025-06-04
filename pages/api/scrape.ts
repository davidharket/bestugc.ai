import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import crypto from 'crypto'

// Helper function to ensure directory exists
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Helper function to get a file extension
const getFileExtension = (url: string): string => {
  try {
    const pathname = new URL(url).pathname
    const ext = path.extname(pathname)
    return ext || '.jpg' // Default to .jpg if no extension found
  } catch {
    return '.jpg' // Default on URL parsing error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url: pageUrl } = req.body
  if (!pageUrl || typeof pageUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url' })
  }

  try {
    const { data: html } = await axios.get(pageUrl, { timeout: 10000 })
    const $ = cheerio.load(html)

    const text = $('body').text().replace(/\s+/g, ' ').trim()

    const scrapeId = crypto.randomBytes(8).toString('hex')
    const baseUploadPath = path.join(process.cwd(), 'public', 'uploads', 'scraped', scrapeId)
    ensureDirExists(baseUploadPath)

    const downloadedImages: string[] = []
    const imagePromises = $('img').map(async (_, el) => {
      const src = $(el).attr('src')
      if (src) {
        try {
          const absoluteSrc = new URL(src, pageUrl).toString()
          const imageResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 5000 })
          const extension = getFileExtension(absoluteSrc)
          const filename = `${crypto.randomBytes(6).toString('hex')}${extension}`
          const imagePath = path.join(baseUploadPath, filename)
          fs.writeFileSync(imagePath, imageResponse.data)
          downloadedImages.push(`/uploads/scraped/${scrapeId}/${filename}`)
        } catch (imgError: any) {
          console.warn(`Failed to download image ${src}: ${imgError.message}`)
        }
      }
    }).get()

    await Promise.all(imagePromises)

    // Basic video download attempt (can be significantly improved for robustness/large files)
    const downloadedVideos: string[] = []
    const videoPromises = $('video source[src], video[src]').map(async (_, el) => {
      let src = $(el).attr('src')
      if (src) {
        try {
          const absoluteSrc = new URL(src, pageUrl).toString()
          // For videos, a more robust check for content type and size limit might be needed here.
          // This is a simplified download for demonstration.
          const videoResponse = await axios.get(absoluteSrc, { responseType: 'arraybuffer', timeout: 15000 })
          const extension = getFileExtension(absoluteSrc) || '.mp4'
          const filename = `${crypto.randomBytes(6).toString('hex')}${extension}`
          const videoPath = path.join(baseUploadPath, filename)
          fs.writeFileSync(videoPath, videoResponse.data)
          downloadedVideos.push(`/uploads/scraped/${scrapeId}/${filename}`)
        } catch (vidError: any) {
          console.warn(`Failed to download video ${src}: ${vidError.message}`)
        }
      }
    }).get()

    await Promise.all(videoPromises)

    res.status(200).json({ 
      text, 
      images: downloadedImages, 
      videos: downloadedVideos, 
      scrapeId
    })

  } catch (error: any) {
    console.error('Scraping failed:', error.message, error.stack)
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Scraping timed out. The target page might be too slow to respond.', details: error.message })
    }
    res.status(500).json({ error: 'Failed to scrape page', details: error.message })
  }
} 