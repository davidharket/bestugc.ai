const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompletedAd() {
  console.log('🔧 Fixing completed ad status in database...');
  
  try {
    // Find the most recent ad that should be completed
    const ad = await prisma.ad.findFirst({
      where: { 
        OR: [
          { status: 'RENDERING' },
          { status: 'PENDING' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!ad) {
      console.log('❌ No ads found in RENDERING/PENDING status');
      return;
    }

    console.log(`📋 Found ad: ${ad.id} - ${ad.brandName || 'Unnamed'}`);
    console.log(`📹 Current status: ${ad.status}`);
    
    // Look for the rendered video file
    const fs = require('fs');
    const path = require('path');
    const rendersDir = path.join(process.cwd(), 'public', 'renders');
    
    if (fs.existsSync(rendersDir)) {
      const files = fs.readdirSync(rendersDir)
        .filter(file => file.endsWith('.mp4'))
        .map(file => ({
          file,
          mtime: fs.statSync(path.join(rendersDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      if (files.length > 0) {
        const latestVideo = files[0].file;
        const finalVideoUrl = `/renders/${latestVideo}`;
        
        await prisma.ad.update({
          where: { id: ad.id },
          data: { 
            finalVideoUrl: finalVideoUrl, 
            status: 'COMPLETED' 
          }
        });
        
        console.log(`✅ Ad updated successfully!`);
        console.log(`📹 Video URL: ${finalVideoUrl}`);
        console.log(`🎬 You can now view it at: ***REMOVED***/creations`);
      } else {
        console.log('❌ No video files found in renders directory');
      }
    } else {
      console.log('❌ Renders directory not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing ad:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompletedAd().catch(console.error); 