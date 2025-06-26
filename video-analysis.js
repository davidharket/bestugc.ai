const fs = require('fs');
const path = require('path');

async function analyzeVideoFiles() {
    console.log('🎥 Video File Analysis Report');
    console.log('='.repeat(50));
    
    const directories = [
        { name: 'Avatars', path: 'public/avatars' },
        { name: 'Cutouts', path: 'public/cutouts' },
        { name: 'Videos', path: 'public/videos' },
        { name: 'Videos Fixed', path: 'public/videos-fixed' }
    ];
    
    for (const dir of directories) {
        console.log(`\n📁 ${dir.name} (${dir.path})`);
        console.log('-'.repeat(30));
        
        try {
            if (!fs.existsSync(dir.path)) {
                console.log('❌ Directory does not exist');
                continue;
            }
            
            const files = fs.readdirSync(dir.path).filter(file => 
                file.toLowerCase().endsWith('.mp4') || 
                file.toLowerCase().endsWith('.webm') || 
                file.toLowerCase().endsWith('.mov')
            );
            
            if (files.length === 0) {
                console.log('📭 No video files found');
                continue;
            }
            
            for (const file of files) {
                const filePath = path.join(dir.path, file);
                const stats = fs.statSync(filePath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                console.log(`\n📄 ${file}`);
                console.log(`   Size: ${sizeInMB} MB (${stats.size} bytes)`);
                console.log(`   Modified: ${stats.mtime.toISOString()}`);
                
                // Try to read first few bytes to check file integrity
                try {
                    const buffer = fs.readFileSync(filePath, { start: 0, end: 100 });
                    const header = buffer.toString('hex');
                    
                    // Check for common video file signatures
                    if (header.startsWith('000000')) {
                        console.log(`   ✅ Valid MP4 signature detected`);
                    } else if (header.includes('66747970')) {
                        console.log(`   ✅ MP4 ftyp atom detected`);
                    } else {
                        console.log(`   ⚠️  Unusual file header: ${header.substring(0, 20)}...`);
                    }
                } catch (readError) {
                    console.log(`   ❌ Error reading file: ${readError.message}`);
                }
            }
        } catch (error) {
            console.log(`❌ Error accessing directory: ${error.message}`);
        }
    }
    
    console.log('\n🔧 Recommendations:');
    console.log('-'.repeat(30));
    console.log('1. Test videos in browser using video-compatibility-test.html');
    console.log('2. Videos larger than 5MB may cause timeout issues');
    console.log('3. Check for corrupted files with unusual headers');
    console.log('4. Consider re-encoding problematic videos');
    
    // Generate test commands
    console.log('\n🧪 Test Commands:');
    console.log('-'.repeat(30));
    console.log('# Start Next.js server (if not running):');
    console.log('npm run dev');
    console.log('');
    console.log('# Open video test page:');
    console.log('# Navigate to: http://localhost:3001/video-compatibility-test.html');
    console.log('');
    console.log('# Test individual WorkingAvatarMix scene:');
    console.log('node test-working-avatar-mix.js');
}

// Check for specific video issues
function checkVideoIssues() {
    console.log('\n🚨 Common Video Issues to Check:');
    console.log('-'.repeat(40));
    
    const issues = [
        '1. Codec Compatibility: Videos may use unsupported codecs',
        '2. Metadata Loading: Some videos take too long to load metadata',
        '3. File Corruption: Partial or corrupted video files',
        '4. Resolution/Bitrate: High resolution or bitrate causing timeouts',
        '5. Container Format: MP4 container may have compatibility issues',
        '6. Audio Track: Missing or corrupted audio tracks'
    ];
    
    issues.forEach(issue => console.log(issue));
    
    console.log('\n💡 Solutions:');
    console.log('- Re-encode with web-safe settings: H.264 video, AAC audio');
    console.log('- Use lower bitrates and resolutions if needed');
    console.log('- Add proper video preloading in Remotion components');
    console.log('- Implement robust error handling and fallbacks');
}

if (require.main === module) {
    analyzeVideoFiles().then(() => {
        checkVideoIssues();
    }).catch(console.error);
}

module.exports = { analyzeVideoFiles }; 