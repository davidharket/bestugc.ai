import { inngest } from '../pages/api/inngest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const renderVideoJob = inngest.createFunction(
  { id: 'render-video-job' },
  { event: 'ad/render.requested' },
  async ({ event, step }) => {
    const { adId, adData } = event.data

    await step.run('update-status-rendering', async () => {
      await prisma.ad.update({ where: { id: adId }, data: { status: 'RENDERING' } })
    })

    const processedAvatarUrl = await step.run('process-avatar', async () => {
      // Placeholder for TTS, lip-sync and background removal
      console.log('Processing avatar for ad', adId)
      return null
    })

    const finalVideoUrl = await step.run('render-final-video', async () => {
      // Placeholder for Remotion rendering
      console.log('Rendering final video', adId, processedAvatarUrl)
      return `/renders/${adId}.mp4`
    })

    await step.run('update-status-completed', async () => {
      await prisma.ad.update({
        where: { id: adId },
        data: { status: 'COMPLETED', finalVideoUrl },
      })
    })

    return { finalVideoUrl }
  }
)

export default [renderVideoJob]
