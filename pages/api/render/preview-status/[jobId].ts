// pages/api/render/preview-status/[jobId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { previewJobs } from '../preview-start';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ message: 'Invalid job ID' });
  }

  const job = previewJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Calculate elapsed time
  const elapsedSeconds = (Date.now() - job.startTime) / 1000;

  // Clean up completed/failed jobs after 15 minutes (more time for user to view results)
  if ((job.status === 'completed' || job.status === 'failed') && elapsedSeconds > 900) {
    previewJobs.delete(jobId);
    return res.status(410).json({ message: 'Job results expired' });
  }

  // Calculate progress based on elapsed time (estimated 240 seconds for completion)
  const estimatedTotalTime = 240; // 4 minutes
  const progress = job.status === 'completed' ? 100 : Math.min(95, (elapsedSeconds / estimatedTotalTime) * 100);
  
  // Determine stage based on elapsed time
  let stage = 'Processing...';
  if (elapsedSeconds < 30) {
    stage = 'Preparing render data...';
  } else if (elapsedSeconds < 90) {
    stage = 'Bundling Remotion composition...';
  } else if (elapsedSeconds < 180) {
    stage = 'Rendering video frames...';
  } else if (elapsedSeconds < 240) {
    stage = 'Finalizing video...';
  } else {
    stage = 'Completing render...';
  }
  
  if (job.status === 'completed') {
    stage = 'Complete!';
  } else if (job.status === 'failed') {
    stage = 'Failed';
  }

  const response = {
    jobId,
    status: job.status,
    progress: Math.round(progress),
    stage,
    elapsedSeconds: Math.round(elapsedSeconds),
    ...(job.result?.previewVideoUrl && { videoUrl: job.result.previewVideoUrl }),
    ...(job.error && { error: job.error }),
  };

  return res.status(200).json(response);
}