// test-final-render.js
require('dotenv').config({ path: './.env.local' });
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY;

if (!TEST_SECRET_KEY) {
  console.error('❌ ERROR: TEST_SECRET_KEY is not set in your .env.local file.');
  process.exit(1);
}

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'x-test-secret': TEST_SECRET_KEY,
  },
  timeout: 1800000,
});

async function runFinalTest() {
  console.log('🧪 Starting final test with FIXED local assets...');

  try {
    // ✅ THE FIX: Removed the leading slash from the paths.
    // staticFile() expects paths relative to the /public directory.
    const validLocalAssets = [
      'avatars-fixed/female-brunette2-adult-inside.mp4',
      'avatars-fixed/male-blonde-adult-inside.mp4',
    ];

    const lastAd = await prisma.ad.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!lastAd) { throw new Error('No ad found.'); }
    console.log(`✅ Found ad to test: ${lastAd.id}`);

    console.log('\n[Step 1/2] Updating database record with fixed asset paths...');
    await prisma.ad.update({
      where: { id: lastAd.id },
      data: {
        selectedImages: JSON.stringify([]),
        selectedVideos: JSON.stringify(validLocalAssets), // Use the fixed paths
        status: 'PENDING',
        finalVideoUrl: null,
      }
    });
    console.log('✅ Database record updated.');

    console.log('\n[Step 2/2] Triggering pipeline restart...');
    const restartResponse = await axiosInstance.post(`${API_BASE_URL}/api/render/restart-job`, {
      adId: lastAd.id,
    });

    console.log(`\n🎉🎉🎉 SUCCESS! Pipeline Restarted! 🎉🎉🎉`);
    console.log(`✅ Message: "${restartResponse.data.message}"`);
    console.log(`\n👀 Go to your dashboard to monitor progress: ${API_BASE_URL}/dashboard`);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runFinalTest();