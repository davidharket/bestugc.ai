const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            ads: true,
            creations: true,
            subscriptions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('User Details:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'Not set'}`);
      console.log(`   Plan: ${user.plan}`);
      console.log(`   Credits: ${user.credits}`);
      console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Stripe Customer: ${user.stripeCustomerId ? 'Yes' : 'No'}`);
      console.log(`   Ads created: ${user._count.ads}`);
      console.log(`   Creations: ${user._count.creations}`);
      console.log(`   Subscriptions: ${user._count.subscriptions}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();