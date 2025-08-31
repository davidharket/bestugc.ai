// lib/gpu-config.ts
// A minimal, safe configuration to solve the bundling hang.

import { ChromiumOptions, FfmpegOverrideFn } from '@remotion/renderer';
import webpack from 'webpack';

// This interface remains the same.
export interface GPUConfig {
  chromiumOptions: ChromiumOptions;
  ffmpegOverride: FfmpegOverrideFn;
}

// This function remains the same.
export const getProductionGPUConfig = (): GPUConfig => {
  return {
    chromiumOptions: {
      disableWebSecurity: true,
      gl: 'angle-egl',
      ignoreCertificateErrors: true,
      headless: true,
      enableMultiProcessOnLinux: true,
      args: ['--disable-proxy'], // Keep this critical flag
    } as any,
    ffmpegOverride: (info) => {
      const gpuArgs = [
        '-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda', '-c:v', 'h264_nvenc',
        '-preset', 'p4', '-b:v', '5M', '-maxrate', '8M', '-bufsize', '10M', 
        '-profile:v', 'high', '-level:v', '4.1',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'
      ];
      const inputIndex = info.args.findIndex(arg => arg === '-i');
      if (inputIndex !== -1) {
        const beforeInput = info.args.slice(0, inputIndex + 2);
        const afterInput = info.args.slice(inputIndex + 2);
        return [...beforeInput, ...gpuArgs, ...afterInput];
      }
      return [...info.args, ...gpuArgs];
    }
  };
};

// This function remains the same.
export const getPreviewGPUConfig = (): GPUConfig => {
  return {
    chromiumOptions: {
      disableWebSecurity: true,
      gl: 'angle-egl',
      ignoreCertificateErrors: true,
      headless: true,
      enableMultiProcessOnLinux: true,
      args: ['--disable-proxy'], // Keep this critical flag
    } as any,
    ffmpegOverride: (info) => {
      const previewGpuArgs = [
        '-hwaccel', 'cuda', '-c:v', 'h264_nvenc', '-preset', 'p1', '-tune', 'll',
        '-rc', 'cbr', '-b:v', '2M', '-profile:v', 'baseline',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'
      ];
      const inputIndex = info.args.findIndex(arg => arg === '-i');
      if (inputIndex !== -1) {
        const beforeInput = info.args.slice(0, inputIndex + 2);
        const afterInput = info.args.slice(inputIndex + 2);
        return [...beforeInput, ...previewGpuArgs, ...afterInput];
      }
      return [...info.args, ...previewGpuArgs];
    }
  };
};

// --- THIS IS THE CRITICAL FIX ---
// We are replacing your complex Webpack config with a minimal one.
export const getGPUWebpackConfig = (isProduction: boolean = false) => {
  return (config: any) => {
    console.log('[GPU Config] Applying MINIMAL safe Webpack configuration.');

    // Only add the essential CORS headers. Do not touch publicPath or other server configs.
    if (!config.devServer) config.devServer = {};
    config.devServer.headers = {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    };

    // Return the minimally modified config.
    return config;
  };
};
// These helper functions can remain.
export const checkGPURequirements = (): { hasNVIDIA: boolean; hasNVENC: boolean; recommendations: string[]; } => {
  return { hasNVIDIA: true, hasNVENC: true, recommendations: [] };
};
export const createPerformanceMonitor = () => {
  const startTime = Date.now();
  return {
    getElapsedTime: () => (Date.now() - startTime) / 1000,
    logPerformance: (stage: string) => { console.log(`[Performance] ${stage}: ${(Date.now() - startTime) / 1000}s`); }
  };
};
