import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { taskId } = req.query

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'Task ID is required' })
    }

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({ error: 'Runway API key not configured' })
    }

    console.log('Checking task status:', taskId)

    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Runway API error:', response.status, errorData)
      
      if (response.status === 404) {
        return res.status(404).json({ error: 'Task not found' })
      }
      
      throw new Error(`Runway API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log('Task status:', result.status, result.id)

    res.status(200).json({
      taskId: result.id,
      status: result.status,
      createdAt: result.createdAt,
      ...(result.output && { output: result.output }),
      ...(result.failure && { failure: result.failure }),
      ...(result.progress && { progress: result.progress })
    })

  } catch (error: any) {
    console.error('Error checking task status:', error)
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      return res.status(429).json({ error: 'Runway API quota exceeded' })
    }

    res.status(500).json({ error: `Failed to check task status: ${error.message}` })
  }
}