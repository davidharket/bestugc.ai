// test-template-pipeline.js
require('dotenv').config({ path: './.env.local' });
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE_URL = '***REMOVED***';

async function runTemplateTest() {
  console.log('🧪 Starting template-driven pipeline test...');

  // --- CONFIGURATION: Choose which template to test ---
  const TEMPLATE_TO_TEST = 'fast-paced-hook'; // Change this to test other templates
  // ----------------------------------------------------

  try {
    // Step 1: Create a new Ad record in the database to simulate a user starting a job.
    console.log(`[1/2] Creating a new Ad record for template: ${TEMPLATE_TO_TEST}...`);
    
    // This is the data that would have been collected from the user in the UI.
    const newAd = await prisma.ad.create({
      data: {
        userId: 'cmbluea8y0000f6qg2pphk9to', // IMPORTANT: Replace with a REAL user ID from your database
        status: 'QUEUED',
        brandName: 'Curli Hairdryer',
        script: 'Tired of frizz? Our hydrating shampoo gives you the soft, defined curls you have always wanted. Try it today! Get yours now.',
        language: 'en',
        // --- User's selected assets ---
        selectedImages: JSON.stringify([
          'uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp',
          'uploads/scraped/2ebccc5c81598a87/fee4376401fe.webp',
        ]),
        selectedVideos: JSON.stringify([
          'uploads/scraped/2ebccc5c81598a87/0e8851bafdd8.mp4',
          'uploads/scraped/2ebccc5c81598a87/1be8fed6bca1.mp4',
        ]),
        // This will be created and filled in by the Inngest pipeline
        syncLabsJobId: '01ac3a7d-940f-4f05-b474-f5a586412272', // Using a real job ID for testing
      },
    });
    console.log(`✅ Ad record created with ID: ${newAd.id}`);

    // Step 2: Trigger the Inngest job by calling our API endpoint.
    console.log(`[2/2] Triggering Inngest event 'ad/render.requested'...`);
    
    // We are simulating the "Render" button click.
    // NOTE: This endpoint does not exist yet. We will create it.
    // For now, we will call the old one and adapt it.
    const response = await axios.post(`${API_BASE_URL}/api/render/start-job`, {
      adId: newAd.id,
      templateId: TEMPLATE_TO_TEST, // Pass the chosen template ID
      // Pass the minimal adData the endpoint needs to start
      adData: {
        script: newAd.script,
        language: newAd.language,
      }
    });

    console.log('\n🎉 SUCCESS! Pipeline job started successfully!');
    console.log(`✅ Inngest accepted the event for Ad ID: ${response.data.adId}`);
    console.log('👀 Monitor your Inngest dashboard or server logs to see the steps run.');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('API Response Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runTemplateTest();