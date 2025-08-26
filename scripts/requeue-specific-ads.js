const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function requeueSpecificAds() {
  // Get ad IDs from command-line arguments
  const adIds = process.argv.slice(2);

  if (adIds.length === 0) {
    console.log('Please provide at least one Ad ID to requeue.');
    console.log('Usage: node scripts/requeue-specific-ads.js <adId1> <adId2> ...');
    return;
  }

  console.log(`Attempting to requeue ${adIds.length} ad(s)...`);

  for (const adId of adIds) {
    try {
      // First, check if the ad exists
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
      });

      if (!ad) {
        console.warn(`- Ad with ID: ${adId} not found. Skipping.`);
        continue; // Skip to the next ID
      }

      // If the ad exists, update its status to 'PENDING'
      await prisma.ad.update({
        where: {
          id: adId,
        },
        data: {
          status: 'PENDING',
          // Optional: You might want to clear old error-related fields
          // inngestRunId: null, 
        },
      });
      console.log(`- Successfully requeued ad with ID: ${adId}`);

    } catch (error) {
      console.error(`- Error requeueing ad with ID ${adId}:`, error.message);
    }
  }

  await prisma.$disconnect();
}

requeueSpecificAds();
