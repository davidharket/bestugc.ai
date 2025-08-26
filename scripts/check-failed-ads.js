const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFailedAds() {
  try {
    const failedAds = await prisma.ad.findMany({
      where: {
        status: 'FAILED',
      },
    });

    if (failedAds.length === 0) {
      console.log('No failed ads found.');
      return;
    }

    console.log(`Found ${failedAds.length} failed ads:`);
    failedAds.forEach(ad => {
      console.log(`- Ad ID: ${ad.id}, User ID: ${ad.userId}, Created At: ${ad.createdAt}`);
    });

  } catch (error) {
    console.error('Error fetching failed ads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFailedAds();
