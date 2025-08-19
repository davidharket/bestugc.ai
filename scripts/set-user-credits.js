// scripts/set-user-credits.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// The amount of credits to set for the user.
const NEW_CREDIT_BALANCE = 400;

async function main() {
  try {
    // Get the user's email from the command line arguments.
    const userEmail = process.argv[2];

    if (!userEmail) {
      console.error('\n❌ Error: Please provide the user\'s email address as an argument.');
      console.log('   Usage: node scripts/set-user-credits.js user@example.com\n');
      process.exit(1);
    }

    console.log(`🔍 Searching for user with email: ${userEmail}...`);

    // Find the user in the database.
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    // If no user is found, exit with an error.
    if (!user) {
      console.error(`\n❌ Error: User with email "${userEmail}" not found.\n`);
      return;
    }

    console.log(`  > Found user: ${user.name} (Current credits: ${user.credits})`);

    // Update the user's credits to the specified amount.
    const updatedUser = await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        credits: NEW_CREDIT_BALANCE,
      },
    });

    console.log(`\n✅ Success! User "${updatedUser.email}" credit balance has been set to ${updatedUser.credits}.\n`);

  } catch (error) {
    console.error('\nAn unexpected error occurred:', error);
    process.exit(1);
  } finally {
    // Ensure the database connection is closed.
    await prisma.$disconnect();
  }
}

main();
