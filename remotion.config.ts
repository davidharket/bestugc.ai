// remotion.config.ts - Optimized for GPU acceleration and performance
import { Config } from '@remotion/cli/config';
import path from 'path';
import { getGPUWebpackConfig } from './lib/gpu-config';

// GPU-optimized video settings
Config.setVideoImageFormat('jpeg'); // JPEG is faster for GPU processing
Config.setJpegQuality(90); // High quality but faster than PNG
Config.setPixelFormat('yuv420p'); // Standard format, better GPU support
Config.setCodec('h264'); // Hardware accelerated codec
Config.setPublicDir('./public-minimal');

// Enable GPU acceleration
Config.setChromiumOpenGlRenderer('angle-egl'); // Best for NVIDIA T4
Config.setConcurrency(2); // Limit concurrency to avoid GPU memory issues
Config.setHardwareAcceleration('if-possible'); // Enable hardware encoding when available

// Bundle size optimization - DISABLE caching to avoid serialization issues
Config.setCachingEnabled(false);

// Fix port mismatch - force renderer to use staging port
const rendererPort = parseInt(process.env.REMOTION_RENDERER_PORT || '3001', 10);
Config.setStudioPort(3002); // Studio port - not used in production API mode  
Config.setRendererPort(rendererPort); // Force renderer to use the configured port for bundle serving

// Use minimal public directory for faster bundling
Config.setPublicDir('./public-minimal');

console.log(`[Remotion Config] Setting renderer port to: ${rendererPort}`);
console.log(`[Remotion Config] Setting public directory to: ./public-minimal`);

// Use custom chromium launcher with GPU flags
const chromeLauncher = path.join(process.cwd(), 'chromium-launcher.sh');
Config.setBrowserExecutable(chromeLauncher);

// Apply GPU webpack configuration with publicPath fix
Config.overrideWebpackConfig(getGPUWebpackConfig(false));
