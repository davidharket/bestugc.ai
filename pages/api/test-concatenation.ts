import { NextApiRequest, NextApiResponse } from 'next'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting test concatenation...')

    // Use existing files
    const generatedVideoPath = '/var/www/ageco.ai/temp/generated_1755876623990.mp4'
    const avatarVideoPath = '/var/www/ageco.ai/public/avatars/female-blonde5-adult-inside-new.mp4'
    
    // Check if files exist
    if (!fs.existsSync(generatedVideoPath)) {
      return res.status(404).json({ error: 'Generated video not found' })
    }
    
    if (!fs.existsSync(avatarVideoPath)) {
      return res.status(404).json({ error: 'Avatar video not found' })
    }

    // Create output path
    const timestamp = Date.now()
    const outputVideoPath = path.join(process.cwd(), 'public', 'generated_videos', `test_concatenated_${timestamp}.mp4`)

    // Ensure generated_videos directory exists
    const generatedVideosDir = path.join(process.cwd(), 'public', 'generated_videos')
    if (!fs.existsSync(generatedVideosDir)) {
      fs.mkdirSync(generatedVideosDir, { recursive: true })
    }

    console.log('Input files:')
    console.log('Generated video:', generatedVideoPath)
    console.log('Avatar video:', avatarVideoPath)
    console.log('Output video:', outputVideoPath)

    // Test the new FFmpeg command with scaling to match resolutions
    const ffmpegCommand = `ffmpeg -i "${generatedVideoPath}" -i "${avatarVideoPath}" -filter_complex "[0:v]scale=720:1280[v0];[1:v]scale=720:1280[v1];[v0][v1]concat=n=2:v=1[outv]" -map "[outv]" -map "1:a" -c:v libx264 -c:a aac "${outputVideoPath}" -y`
    
    console.log('Running FFmpeg command:', ffmpegCommand)

    try {
      execSync(ffmpegCommand, { stdio: 'inherit' })
      console.log('FFmpeg command completed successfully')
    } catch (error) {
      console.error('FFmpeg error:', error)
      throw new Error('Failed to concatenate videos')
    }

    // Check if output file was created
    if (!fs.existsSync(outputVideoPath)) {
      throw new Error('Output video file was not created')
    }

    // Get file info
    const stat = fs.statSync(outputVideoPath)
    const filename = path.basename(outputVideoPath)
    
    console.log('Test concatenation completed successfully!')
    console.log('Output file size:', stat.size, 'bytes')

    // Return the API serve URL
    const videoUrl = `/api/serve-video/generated_videos/${filename}`
    
    res.status(200).json({
      success: true,
      message: 'Test concatenation completed successfully',
      videoUrl,
      fileSize: stat.size,
      timestamp
    })

  } catch (error: any) {
    console.error('Error in test concatenation:', error)
    
    res.status(500).json({ 
      error: `Test concatenation failed: ${error.message}` 
    })
  }
}