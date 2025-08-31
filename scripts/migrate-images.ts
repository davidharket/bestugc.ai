#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { downloadAndStoreImage } from '../lib/image-storage'

const prisma = new PrismaClient()

async function migrateExternalImages() {
  console.log('🔄 Starting image migration...')
  
  try {
    // Find all product images with external URLs that haven't been migrated
    const externalImages = await prisma.productImage.findMany({
      where: {
        AND: [
          {
            OR: [
              { imageUrl: { startsWith: 'http' } },
              { imageUrl: { contains: 'bestugc.ai/images' } }
            ]
          },
          {
            NOT: {
              imageUrl: { startsWith: '/api/serve-image' }
            }
          }
        ],
        status: 'COMPLETED'
      }
    })

    console.log(`📸 Found ${externalImages.length} external images to migrate`)

    let successCount = 0
    let failureCount = 0

    for (const image of externalImages) {
      try {
        console.log(`⬇️  Downloading image ${image.id}: ${image.imageUrl}`)
        
        const downloadResult = await downloadAndStoreImage(image.imageUrl, image.userId)
        
        if (downloadResult.success) {
          // Update the database with the new local URL
          await prisma.productImage.update({
            where: { id: image.id },
            data: { imageUrl: downloadResult.localUrl }
          })
          
          console.log(`✅ Migrated image ${image.id} to ${downloadResult.localUrl}`)
          successCount++
        } else {
          console.error(`❌ Failed to download image ${image.id}: ${downloadResult.error}`)
          failureCount++
        }
      } catch (error) {
        console.error(`❌ Error processing image ${image.id}:`, error)
        failureCount++
      }
    }

    console.log(`\n📊 Migration complete:`)
    console.log(`✅ Successfully migrated: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateExternalImages()
}