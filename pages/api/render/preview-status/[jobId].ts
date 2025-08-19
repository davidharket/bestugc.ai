// pages/api/render/preview-status/[jobId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import fs from 'fs'; // Import Node.js filesystem module
import path from 'path'; // Import Node.js path module

// Define the same path to the jobs directory
const jobsDir = path.resolve(process.cwd(), '.tmp', 'preview-jobs');

// REMOVED: import { previewJobs } from '../preview-start';

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

  // Read job status from the file system
  const jobFilePath = path.join(jobsDir, `${jobId}.json`);
  let job;

  try {
    if (fs.existsSync(jobFilePath)) {
      const fileContent = fs.readFileSync(jobFilePath, 'utf-8');
      job = JSON.parse(fileContent);
    }
  } catch (error) {
    console.error(`[Preview Status] Failed to read or parse job file for ${jobId}:`, error);
    return res.status(500).json({ message: 'Error retrieving job status.' });
  }

  console.log(`[Preview Status] Checking job file ${jobId}, found:`, !!job);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  const elapsedSeconds = (Date.now() - job.startTime) / 1000;

  // Clean up completed/failed jobs after 15 minutes
  if ((job.status === 'completed' || job.status === 'failed') && elapsedSeconds > 900) {
    try {
      // Delete the file instead of removing from Map
      fs.unlinkSync(jobFilePath);
      console.log(`[Preview Status] Cleaned up expired job file: ${jobId}.json`);
    } catch (error) {
        console.error(`[Preview Status] Failed to clean up job file for ${jobId}:`, error);
    }
    return res.status(410).json({ message: 'Job results expired' });
  }

  // The rest of this file's logic for calculating progress and stage remains the same
  const estimatedTotalTime = 120;
  const progress = job.status === 'completed' ? 100 : Math.min(95, (elapsedSeconds / estimatedTotalTime) * 100);

  let stage = 'Processing...';
  if (elapsedSeconds < 10) {
    stage = 'Preparing render data...';
  } else if (elapsedSeconds < 35) {
    stage = 'Bundling Remotion composition...';
  } else if (elapsedSeconds < 90) {
    stage = 'Rendering video frames...';
  } else if (elapsedSeconds < 120) {
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

