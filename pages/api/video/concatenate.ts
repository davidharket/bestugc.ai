import { NextApiRequest, NextApiResponse } from 'next'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { generatedVideoUrl, avatarId } = req.body

    if (!generatedVideoUrl || !avatarId) {
      return res.status(400).json({ error: 'Missing required parameters: generatedVideoUrl and avatarId' })
    }

    console.log('Concatenating videos...', { generatedVideoUrl, avatarId })

    // Map avatar ID to video file name
    const avatarVideoMap: { [key: string]: string } = {
      'female-blonde5-adult-inside-new': 'female-blonde5-adult-inside-new.mp4',
      'female-blonde-inside-new': 'female-blonde-inside-new.mp4',
      'female-blonde4-adult-inside-new': 'female-blonde4-adult-inside-new.mp4',
      'female-brunette-inside-new': 'female-brunette-inside-new.mp4',
      'male-brunette-adult-inside-new': 'male-brunette-adult-inside-new.mp4',
      'male-brunette2-adult-inside-new': 'male-brunette2-adult-inside-new.mp4',
      'male-brunette3-adult-inside-new': 'male-brunette3-adult-inside-new.mp4'
    }

    const avatarVideoFile = avatarVideoMap[avatarId]
    if (!avatarVideoFile) {
      return res.status(400).json({ error: `No avatar video found for ID: ${avatarId}` })
    }

    const avatarVideoPath = path.join(process.cwd(), 'public', 'avatars', avatarVideoFile)
    
    // Check if avatar video exists
    if (!fs.existsSync(avatarVideoPath)) {
      return res.status(404).json({ error: `Avatar video not found: ${avatarVideoFile}` })
    }

    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    const timestamp = Date.now()
    const downloadedVideoPath = path.join(tempDir, `generated_${timestamp}.mp4`)
    const outputVideoPath = path.join(tempDir, `concatenated_${timestamp}.mp4`)
    // Save to both locations - generated_videos (for API access) and avatars (for public access)
    const outputPublicPath = path.join(process.cwd(), 'public', 'generated_videos', `concatenated_${timestamp}.mp4`)
    const outputAvatarsPath = path.join(process.cwd(), 'public', 'avatars', `concatenated_${timestamp}.mp4`)

    // Create directories if they don't exist
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated_videos')
    if (!fs.existsSync(generatedVideosDir)) {
      fs.mkdirSync(generatedVideosDir, { recursive: true })
    }
    
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars')
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true })
    }

    // Download the generated video
    console.log('Downloading generated video...')
    const response = await fetch(generatedVideoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }
    
    const videoBuffer = await response.arrayBuffer()
    fs.writeFileSync(downloadedVideoPath, Buffer.from(videoBuffer))

    // Create concatenation list file for FFmpeg
    const concatListPath = path.join(tempDir, `concat_${timestamp}.txt`)
    const concatContent = `file '${downloadedVideoPath}'\nfile '${avatarVideoPath}'`
    fs.writeFileSync(concatListPath, concatContent)

    // Use FFmpeg concat filter with scaling to handle resolution mismatches
    console.log('Concatenating videos with FFmpeg using concat filter...')
    // Scale both videos to 720x1280 and concatenate, use audio from avatar video
    // Use SyncLabs-compatible encoding settings: baseline profile, yuv420p pixel format, 25fps
    const ffmpegCommand = `ffmpeg -i "${downloadedVideoPath}" -i "${avatarVideoPath}" -filter_complex "[0:v]scale=720:1280:flags=lanczos[v0];[1:v]scale=720:1280:flags=lanczos[v1];[v0][v1]concat=n=2:v=1:a=0[outv]" -map "[outv]" -map "1:a" -c:v libx264 -profile:v baseline -level 3.1 -pix_fmt yuv420p -r 25 -c:a aac -ar 48000 -ac 2 -b:a 128k "${outputPublicPath}" -y`
    
    try {
      execSync(ffmpegCommand, { stdio: 'inherit' })
      
      // Copy to avatars directory for public access
      console.log('Copying concatenated video to public avatars directory...')
      execSync(`cp "${outputPublicPath}" "${outputAvatarsPath}"`, { stdio: 'inherit' })
      
    } catch (error) {
      console.error('FFmpeg error:', error)
      throw new Error('Failed to concatenate videos')
    }

    // Clean up temporary files
    fs.unlinkSync(downloadedVideoPath)
    fs.unlinkSync(concatListPath)

    // Return both API endpoint and direct public URL for the concatenated video
    const finalVideoUrl = `/generated_videos/concatenated_${timestamp}.mp4`
    const publicVideoUrl = `/avatars/concatenated_${timestamp}.mp4` // Direct public access via avatars directory
    
    console.log('Video concatenation completed:', finalVideoUrl)
    
    res.status(200).json({
      success: true,
      videoUrl: finalVideoUrl,
      publicVideoUrl: publicVideoUrl,
      message: 'Videos concatenated successfully'
    })

  } catch (error: any) {
    console.error('Error concatenating videos:', error)
    
    res.status(500).json({ 
      error: `Failed to concatenate videos: ${error.message}` 
    })
  }
}