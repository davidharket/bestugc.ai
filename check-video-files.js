const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVideoFiles() {
  console.log('🔍 Checking video files and database...');
  
  try {
    // Check what video files exist
    const rendersDir = path.join(process.cwd(), 'public', 'renders');
    console.log(`📁 Checking renders directory: ${rendersDir}`);
    
    if (fs.existsSync(rendersDir)) {
      const files = fs.readdirSync(rendersDir).filter(f => f.endsWith('.mp4'));
      console.log(`\n📹 Found ${files.length} video files:`);
      
      files.forEach((file, i) => {
        const filePath = path.join(rendersDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
        const created = stats.birthtime.toLocaleString();
        console.log(`${i + 1}. ${file} (${sizeMB}MB) - Created: ${created}`);
      });
      
      // Check database entries
      const ads = await prisma.ad.findMany({
        select: { id: true, brandName: true, status: true, finalVideoUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`\n📋 Database ads (${ads.length}):`);
      ads.forEach((ad, i) => {
        console.log(`${i + 1}. ${ad.brandName || 'Untitled'} - Status: ${ad.status}`);
        console.log(`   Video URL: ${ad.finalVideoUrl || 'None'}`);
        console.log(`   Created: ${ad.createdAt.toLocaleString()}`);
        
        if (ad.finalVideoUrl) {
          const videoPath = path.join(process.cwd(), 'public', ad.finalVideoUrl);
          const exists = fs.existsSync(videoPath);
          console.log(`   File exists: ${exists ? '✅' : '❌'}`);
        }
        console.log('');
      });
      
      // Fix any mismatched paths
      if (files.length > 0 && ads.length > 0) {
        const latestFile = files
          .map(f => ({ name: f, time: fs.statSync(path.join(rendersDir, f)).mtime }))
          .sort((a, b) => b.time.getTime() - a.time.getTime())[0];
          
        const latestAd = ads[0];
        const expectedPath = `/renders/${latestFile.name}`;
        
        if (latestAd.finalVideoUrl !== expectedPath) {
          console.log(`🔧 Updating ad ${latestAd.id.slice(0, 8)} video URL...`);
          console.log(`   From: ${latestAd.finalVideoUrl}`);
          console.log(`   To:   ${expectedPath}`);
          
          await prisma.ad.update({
            where: { id: latestAd.id },
            data: { finalVideoUrl: expectedPath }
          });
          
          console.log('✅ Database updated!');
        } else {
          console.log('✅ Database URL matches latest file!');
        }
      }
      
    } else {
      console.log('❌ Renders directory does not exist!');
      console.log('Creating renders directory...');
      fs.mkdirSync(rendersDir, { recursive: true });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoFiles(); 