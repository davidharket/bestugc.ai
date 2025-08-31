import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'

export interface ImageDownloadResult {
  success: boolean
  localUrl?: string
  error?: string
}

/**
 * Download an image from a URL and store it locally
 */
export async function downloadAndStoreImage(imageUrl: string, userId: string): Promise<ImageDownloadResult> {
  try {
    // Generate a unique filename
    const fileExtension = path.extname(new URL(imageUrl).pathname) || '.jpg'
    const filename = `${userId}-${uuidv4()}${fileExtension}`
    const userDir = path.join(process.cwd(), 'public', 'user-images', userId)
    const filePath = path.join(userDir, filename)
    
    // Ensure user directory exists
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true })
    }

    // Download the image
    await downloadImage(imageUrl, filePath)
    
    // Return the local URL path (relative to domain)
    const localUrl = `/api/serve-image/${userId}/${filename}`
    
    return { success: true, localUrl }
  } catch (error) {
    console.error('Error downloading image:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Download an image from URL to file path
 */
function downloadImage(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    
    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }

      const fileStream = fs.createWriteStream(filePath)
      
      response.pipe(fileStream)
      
      fileStream.on('finish', () => {
        fileStream.close()
        resolve()
      })
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}) // Delete partial file
        reject(err)
      })
    })
    
    request.on('error', (err) => {
      reject(err)
    })
    
    request.setTimeout(30000, () => {
      request.destroy()
      reject(new Error('Download timeout'))
    })
  })
}

/**
 * Clean up old images for a user (optional utility)
 */
export function cleanupOldImages(userId: string, keepCount: number = 50): void {
  try {
    const userDir = path.join(process.cwd(), 'public', 'user-images', userId)
    
    if (!fs.existsSync(userDir)) return
    
    const files = fs.readdirSync(userDir)
      .map(file => ({
        name: file,
        path: path.join(userDir, file),
        stats: fs.statSync(path.join(userDir, file))
      }))
      .filter(file => file.stats.isFile())
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
    
    // Delete old files beyond keepCount
    for (let i = keepCount; i < files.length; i++) {
      fs.unlinkSync(files[i].path)
    }
  } catch (error) {
    console.error('Error cleaning up old images:', error)
  }
}