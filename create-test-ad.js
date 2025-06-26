// create-test-ad.js
require('dotenv').config({ path: './.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating a new test ad record...');

  // Find the first user to assign the ad to.
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No users found in the database. Please sign up in the app first.');
  }
  console.log(`👤 Using user: ${user.email}`);

  // This is the product URL that was causing issues.
  const productUrl = 'https://www.curli.no/produkt/aeroflow-bla/'; // Replace if you used a different one

  const newAd = await prisma.ad.create({
    data: {
      userId: user.id,
      productUrl: productUrl,
      brandName: "Test Ad to be Fixed",
      status: "FAILED", // Start with a FAILED status to simulate a broken ad
      // Intentionally leave selectedImages/selectedVideos empty or with dummy data
      selectedImages: JSON.stringify(['/dummy/image1.jpg']),
      selectedVideos: JSON.stringify(['/dummy/bad_video.mp4']), // This simulates the bad data
      // We will leave syncLabsJobId null for now. The pipeline will create it.
    },
  });

  console.log('✅ Successfully created a new test ad with ID:', newAd.id);
  console.log('👍 You can now run the main Inngest pipeline on this ad.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });