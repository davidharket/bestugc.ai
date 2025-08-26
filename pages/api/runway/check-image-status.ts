import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { taskIds } = req.body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'Task IDs are required' })
    }

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({ error: 'Runway API key not configured' })
    }

    console.log(`Checking status for ${taskIds.length} tasks...`)
    console.log(`Task IDs: ${taskIds.join(', ')}`)
    
    // Check status of all tasks
    const statusChecks = taskIds.map(async (taskId, index) => {
      try {
        const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06'
          }
        })

        console.log(`Task ${taskId} HTTP status: ${statusResponse.status}`)

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text()
          console.error(`Status check failed for task ${taskId}:`, statusResponse.status, errorText)
          return {
            id: `img-${index}-${Date.now()}`,
            taskId,
            status: 'ERROR',
            url: null,
            error: `HTTP ${statusResponse.status}: ${errorText}`
          }
        }

        const statusData = await statusResponse.json()
        console.log(`Task ${taskId} full response:`, JSON.stringify(statusData, null, 2))
        
        if (statusData.status === 'SUCCEEDED') {
          const imageUrl = statusData.output?.[0] || statusData.artifacts?.[0]?.uri || statusData.artifacts?.[0]?.url
          console.log(`Task ${taskId} completed - URL: ${imageUrl}`)
          return {
            id: `img-${index}-${Date.now()}`,
            taskId,
            status: 'SUCCEEDED',
            url: imageUrl
          }
        } else if (statusData.status === 'FAILED') {
          console.error(`Task ${taskId} failed:`, statusData)
          return {
            id: `img-${index}-${Date.now()}`,
            taskId,
            status: 'FAILED',
            url: null,
            error: statusData.failure?.reason || statusData.failure_reason || 'Unknown error'
          }
        } else {
          // Still processing (pending, running, etc.)
          console.log(`Task ${taskId} still processing: ${statusData.status}`)
          return {
            id: `img-${index}-${Date.now()}`,
            taskId,
            status: statusData.status.toUpperCase(),
            url: null
          }
        }
      } catch (error) {
        console.error(`Error checking status for task ${taskId}:`, error)
        return {
          id: `img-${index}-${Date.now()}`,
          taskId,
          status: 'ERROR',
          url: null,
          error: error instanceof Error ? error.message : 'Status check failed'
        }
      }
    })

    const results = await Promise.all(statusChecks)
    
    // Count completed vs pending
    const completed = results.filter(r => r.status === 'SUCCEEDED')
    const failed = results.filter(r => r.status === 'FAILED' || r.status === 'ERROR')
    const processing = results.filter(r => ['PENDING', 'RUNNING', 'THROTTLED', 'QUEUED'].includes(r.status))
    
    console.log(`Status check complete: ${completed.length} completed, ${processing.length} processing, ${failed.length} failed`)
    
    const allComplete = completed.length === taskIds.length
    const hasFailures = failed.length > 0
    
    let overallStatus = 'PROCESSING'
    if (allComplete) {
      overallStatus = 'COMPLETED'
    } else if (hasFailures && processing.length === 0) {
      overallStatus = 'FAILED'
    }

    res.status(200).json({
      images: results,
      status: overallStatus,
      completed: completed.length,
      processing: processing.length,
      failed: failed.length,
      total: taskIds.length
    })

  } catch (error: any) {
    console.error('Error checking image status:', error)
    res.status(500).json({ error: `Failed to check image status: ${error.message}` })
  }
}