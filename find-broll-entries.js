// find-broll-entries.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findBRollData() {
  console.log('🔍 Searching for ad records with b-roll data...');

  try {
    const adsWithBRoll = await prisma.ad.findMany({
      where: {
        OR: [
          {
            selectedBRoll: {
              not: '[]', // Find records where selectedBRoll is not an empty JSON array
            },
          },
          {
            orderedBRoll: {
              not: '[]', // Find records where orderedBRoll is not an empty JSON array
            },
          },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        selectedBRoll: true,
        orderedBRoll: true,
      },
    });

    if (adsWithBRoll.length === 0) {
      console.log('✅ No ad records found with b-roll entries.');
      return;
    }

    console.log(`Found ${adsWithBRoll.length} ad(s) with b-roll data:\n`);

    adsWithBRoll.forEach((ad) => {
      console.log('------------------------------------');
      console.log(`📄 Ad ID: ${ad.id}`);
      console.log(`   Created At: ${ad.createdAt.toISOString()}`);

      // Parse and display selectedBRoll if it exists
      if (ad.selectedBRoll && ad.selectedBRoll !== '[]') {
        try {
          const selected = JSON.parse(ad.selectedBRoll);
          console.log('   Selected B-Roll (raw paths):');
          selected.forEach((url, i) => console.log(`     [${i}]: ${url}`));
        } catch (e) {
          console.log('   Selected B-Roll (could not parse JSON):', ad.selectedBRoll);
        }
      } else {
        console.log('   Selected B-Roll: None');
      }

      // Parse and display orderedBRoll if it exists
      if (ad.orderedBRoll && ad.orderedBRoll !== '[]') {
        try {
          const ordered = JSON.parse(ad.orderedBRoll);
          console.log('   Ordered B-Roll (structured objects):');
          ordered.forEach((item, i) => console.log(`     [${i}]: Order ${item.order}, URL: ${item.url}`));
        } catch (e) {
          console.log('   Ordered B-Roll (could not parse JSON):', ad.orderedBRoll);
        }
      } else {
        console.log('   Ordered B-Roll: None');
      }
      console.log('------------------------------------\n');
    });
  } catch (error) {
    console.error('❌ An error occurred while querying the database:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database.');
  }
}

findBRollData();
