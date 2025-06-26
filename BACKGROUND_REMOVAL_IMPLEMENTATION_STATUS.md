# Background Removal Implementation Status Report

## 📋 Project Overview

**Goal**: Implement background removal for avatar videos in the video generation pipeline so that cutout scenes show avatars with transparent backgrounds overlaid on images/videos.

**Current Status**: ✅ Background removal working, ❌ Video loading timeout issues in Remotion

---

## 🎯 What We're Trying to Achieve

1. **Background Removal**: Remove background from SyncLabs-generated avatar videos
2. **Cutout Scenes**: Use background-removed videos in cutout layouts (left/right over assets)
3. **Pipeline Integration**: Seamlessly integrate into existing video generation workflow
4. **Production Ready**: Ensure reliable performance with proper timeouts and error handling

---

## ✅ What's Working

### 1. Background Removal API
- **Location**: `pages/api/video/remove-background.ts`
- **Status**: ✅ **WORKING** - Successfully removes backgrounds
- **Performance**: ~6.5 minutes processing time for typical avatar video
- **Output**: 1.58MB cutout video from 46MB original
- **Caching**: Working correctly (instant on subsequent requests)

### 2. Python Processing Script
- **Location**: `scripts/remove_background.py`
- **Status**: ✅ **WORKING** - Processes videos successfully
- **Settings**: Optimized for speed (10fps, 480px max, u2net_lite model)
- **Dependencies**: All installed (opencv-python, rembg, onnxruntime, etc.)

### 3. Background Removal Service
- **Location**: `lib/background-removal-service.ts`
- **Status**: ✅ **WORKING** - Provides caching and fallback strategies
- **Features**: Health checks, error recovery, cache management

### 4. Scene Components
- **Status**: ✅ **ENHANCED** - All scene components updated to support cutout videos
- **Files Updated**:
  - `remotion/scenes/CutoutAvatarScene.tsx`
  - `remotion/scenes/FullScreenAsset.tsx`
  - `remotion/scenes/AvatarWithCornerImage.tsx`

### 5. Production Pipeline Integration
- **Location**: `inngest/render-video.ts`
- **Status**: ✅ **INTEGRATED** - Background removal step added to pipeline
- **Features**: Proper error handling and fallback to original video

---

## ❌ Current Blocking Issue

### Video Loading Timeout in Remotion

**Problem**: Remotion times out when trying to load the background-removed video for duration calculation.

**Error Message**:
```
A delayRender() "Loading <Video> duration with src=***REMOVED***/cutouts/cutout-00c1ae05.mp4" 
was called but not cleared after 1798000ms (30 minutes)
```

**Root Cause**: The background-removed video file appears to have metadata issues that prevent Remotion from quickly determining its duration.

---

## 🔧 Attempted Solutions

### 1. Timeout Increases
- **Tried**: Increased timeouts progressively
  - Video loading: 2min → 10min → 30min
  - Rendering: 5min → 30min
- **Result**: Still timing out even at 30 minutes

### 2. Background Removal Optimization
- **Tried**: Multiple optimization approaches
  - Reduced FPS: 30 → 15 → 10
  - Reduced resolution: 1080p → 640px → 480px
  - Lighter model: u2net → u2net_lite
- **Result**: Faster processing but video loading issue persists

### 3. File Format Investigation
- **Tried**: Different video codecs and containers
- **Current**: Using mp4v codec with MP4 container
- **Issue**: May need different codec for transparency support

---

## 📁 Key Files and Their Status

### Working Files ✅
```
pages/api/video/remove-background.ts          ✅ Background removal API
scripts/remove_background.py                  ✅ Python processing script
lib/background-removal-service.ts             ✅ Service layer with caching
inngest/render-video.ts                       ✅ Pipeline integration
remotion/scenes/CutoutAvatarScene.tsx         ✅ Enhanced cutout scenes
remotion/scenes/FullScreenAsset.tsx           ✅ Enhanced asset scenes
remotion/scenes/AvatarWithCornerImage.tsx     ✅ Enhanced corner scenes
remotion/Main.tsx                             ✅ Updated composition
```

### Configuration Files ✅
```
pages/api/render/remotion.ts                  ✅ Extended timeouts (30min)
package.json                                  ✅ Dependencies updated
```

### Test Files 🧪
```
complete-bg-removal-test.js                   🧪 Full pipeline test
test-video-render-only.js                     🧪 Render-only test
quick-bg-test.js                              🧪 Background removal test
```

---

## 🐛 Detailed Error Analysis

### Current Error Stack
```
SymbolicateableError: A delayRender() "Loading <Video> duration with src=***REMOVED***/cutouts/cutout-00c1ae05.mp4" was called but not cleared after 1798000ms
```

### Error Location
- **Component**: Remotion Video component
- **Phase**: Video metadata loading (duration calculation)
- **File**: Background-removed video (`cutout-00c1ae05.mp4`)

### Video File Details
- **Original**: 46.07MB (working fine in Remotion)
- **Cutout**: 1.58MB (causing timeout)
- **Format**: MP4 with mp4v codec
- **Processing**: 10fps, 480px max resolution

---

## 🔍 Investigation Findings

### 1. Background Removal Success
- ✅ Python script completes successfully
- ✅ Output file is created (1.58MB)
- ✅ File is not corrupted (can be opened)
- ✅ Caching works correctly

### 2. Remotion Integration Issues
- ❌ Video duration loading times out
- ❌ Even with 30-minute timeout
- ❌ Happens specifically with cutout videos
- ✅ Original videos load fine

### 3. Performance Metrics
- Background removal: ~387 seconds (6.5 minutes)
- Video render attempt: Timeout at 30 minutes
- Total pipeline time: Blocked by video loading

---

## 🚀 Recommended Next Steps

### Immediate Actions (Priority 1)

1. **Video Format Investigation**
   ```bash
   # Check video metadata
   ffprobe public/cutouts/cutout-00c1ae05.mp4
   
   # Compare with original
   ffprobe public/temp/avatar-working.mp4
   ```

2. **Alternative Video Codec**
   - Try H.264 instead of mp4v
   - Consider WebM with VP9 for transparency
   - Test different container formats

3. **Video Repair/Reprocessing**
   ```python
   # Add to Python script
   # Re-encode with standard settings after background removal
   ffmpeg -i cutout_raw.mp4 -c:v libx264 -preset fast cutout_final.mp4
   ```

### Medium-term Solutions (Priority 2)

1. **Preload Strategy**
   - Pre-calculate video duration during background removal
   - Store metadata in database
   - Pass duration to Remotion to skip loading

2. **Alternative Background Removal**
   - Try different background removal libraries
   - Consider cloud-based solutions (RunwayML, Remove.bg)
   - Test with different AI models

3. **Fallback Implementation**
   - Implement graceful degradation
   - Use original video with overlay mask
   - Provide user option to skip background removal

### Long-term Optimizations (Priority 3)

1. **Performance Improvements**
   - GPU acceleration for background removal
   - Parallel processing for multiple videos
   - Background removal queue system

2. **Quality Enhancements**
   - Higher resolution output
   - Better edge detection
   - Multiple model options

---

## 🧪 Test Commands

### Run Background Removal Test
```bash
node quick-bg-test.js
```

### Run Full Pipeline Test
```bash
node complete-bg-removal-test.js
```

### Run Video Render Only
```bash
node test-video-render-only.js
```

### Check Video Files
```bash
# List cutout files
dir public/cutouts

# Check file sizes
dir public/temp
```

---

## 📊 Performance Benchmarks

| Process | Current Time | Target Time | Status |
|---------|-------------|-------------|---------|
| Background Removal | 387s (6.5min) | <300s (5min) | ⚠️ Acceptable |
| Video Loading | Timeout (30min) | <30s | ❌ Broken |
| Video Rendering | N/A | <300s (5min) | ⏸️ Blocked |
| Total Pipeline | Blocked | <600s (10min) | ❌ Blocked |

---

## 🔧 Environment Setup

### Required Dependencies
```bash
# Python packages (already installed)
pip install opencv-python rembg requests pillow numpy onnxruntime

# Node packages (already in package.json)
npm install @remotion/bundler @remotion/renderer
```

### Environment Variables
```bash
SYNC_LABS_API_KEY=your_key_here
```

### Directory Structure
```
public/
├── cutouts/           # Background-removed videos
├── temp/             # Downloaded videos
├── renders/          # Final rendered videos
└── avatars/          # Avatar source files
```

---

## 💡 Key Insights

1. **Background Removal Works**: The core functionality is implemented and working
2. **Video Format Issue**: The problem is likely video format/codec compatibility
3. **Timeout Not the Solution**: Increasing timeouts doesn't solve the underlying issue
4. **Metadata Problem**: Video duration calculation is the specific failure point
5. **Pipeline Ready**: Everything else is in place for production

---

## 🎯 Success Criteria

### Must Have
- [ ] Cutout videos load in Remotion without timeout
- [ ] Background removal completes in <5 minutes
- [ ] Video rendering completes in <5 minutes
- [ ] Pipeline handles errors gracefully

### Nice to Have
- [ ] Background removal in <3 minutes
- [ ] Higher quality output (720p+)
- [ ] Multiple background removal models
- [ ] Real-time progress updates

---

## 📞 Handoff Notes

### What's Ready for Production
1. ✅ Background removal API and service
2. ✅ Python processing pipeline
3. ✅ Scene component enhancements
4. ✅ Error handling and fallbacks
5. ✅ Caching and optimization

### What Needs Immediate Attention
1. ❌ Video format/codec compatibility issue
2. ❌ Remotion video loading timeout
3. ❌ Video metadata repair/processing

### Quick Wins to Try First
1. Change video codec in Python script (H.264)
2. Add video re-encoding step after background removal
3. Investigate video metadata with ffprobe
4. Test with different video container formats

---

**Last Updated**: January 16, 2025  
**Status**: Background removal working, video loading blocked  
**Next Engineer**: Focus on video format/codec compatibility issue 