// test-rescrape-and-render.js (Final Version with Auth & Correct Data Types)
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
  timeout: 1800000, // 30-minute timeout
});


async function main() {
  console.log('🚀 Triggering the full end-to-end render pipeline for the latest ad...');

  try {
    const adToRender = await prisma.ad.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!adToRender) {
      throw new Error('No ad found to render. Please run `node create-test-ad.js` first.');
    }
    console.log(`🎯 Targeting ad ID: ${adToRender.id}`);

    const response = await axiosInstance.post(`${API_BASE_URL}/api/render/start-job`, {
      adData: {
        productUrl: adToRender.productUrl,
        summary: "A great hydrating shampoo for beautiful curls.",
        brandName: adToRender.brandName,
        selectedImages: JSON.parse(adToRender.selectedImages || '[]'),
        selectedVideos: JSON.parse(adToRender.selectedVideos || '[]'),
        format: '9:16',
        duration: 30,
        language: 'en',
        audience: 'People with curly hair',
        script: 'Tired of frizz? Our hydrating shampoo gives you the soft, defined curls you have always wanted. Try it today!',
        // ✅ THE FIX: Send IDs as strings to match the Prisma schema
        avatarId: '1',
        templateId: '1',
      },
    });

    console.log('\n✅ Pipeline successfully triggered!');
    console.log(`✅ Message from server: "${response.data.message}"`);
    console.log(`✅ A new Inngest Run ID has been assigned to Ad ID: ${response.data.adId}`);
    console.log(`\n👀 Please go to your dashboard at ${API_BASE_URL}/dashboard to monitor the progress.`);

  } catch (error) {
    console.error('\n❌ TEST FAILED: An error occurred during the test.');
    if (error.response) {
      console.error('API Response Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();