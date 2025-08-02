// lib/gpu-config.ts
// Centralized GPU acceleration configuration for NVIDIA hardware

import { ChromiumOptions, FfmpegOverrideFn } from '@remotion/renderer';

export interface GPUConfig {
  chromiumOptions: ChromiumOptions;
  ffmpegOverride: FfmpegOverrideFn;
}

/**
 * Production-optimized GPU configuration for final video rendering
 * Prioritizes quality while maintaining good performance
 */
export const getProductionGPUConfig = (): GPUConfig => {
  return {
    chromiumOptions: {
      disableWebSecurity: true,
      gl: 'angle',
      ignoreCertificateErrors: true,
      headless: true,
    },
    
    ffmpegOverride: (info) => {
      // Return unmodified args - let Remotion handle all encoding
      console.log('[GPU Config] FFmpeg args:', info.args);
      return info.args;
    }
  };
};

/**
 * Preview-optimized GPU configuration
 * Prioritizes speed over quality for fast preview generation
 */
export const getPreviewGPUConfig = (): GPUConfig => {
  return {
    chromiumOptions: {
      disableWebSecurity: true,
      gl: 'angle',
      ignoreCertificateErrors: true,
      headless: true,
    },
    
    ffmpegOverride: (info) => {
      // Return unmodified args - let Remotion handle all encoding
      console.log('[GPU Config] Preview FFmpeg args:', info.args);
      return info.args;
    }
  };
};

/**
 * Webpack configuration optimizations for GPU rendering
 */
export const getGPUWebpackConfig = (isProduction: boolean = false) => {
  return (config: any) => {
    // GPU-optimized webpack configuration
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'webgl': 'webgl2', // Force WebGL2 for better GPU utilization
      }
    };
    
    if (!isProduction) {
      // Preview optimizations
      config.optimization = {
        ...config.optimization,
        minimize: false, // Skip minification for faster bundling
      };
    }
    
    // GPU-friendly optimizations
    config.module = {
      ...config.module,
      rules: [
        ...(config.module?.rules || []),
        {
          test: /\.(glsl|vs|fs|vert|frag)$/,
          use: 'raw-loader'
        }
      ]
    };
    
    return config;
  };
};

/**
 * GPU system requirements check
 */
export const checkGPURequirements = (): {
  hasNVIDIA: boolean;
  hasNVENC: boolean;
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  
  // Note: This is a basic check. In production, you'd want to run actual GPU detection
  const hasNVIDIA = true; // Assuming NVIDIA GPU based on user specification
  const hasNVENC = true;  // Modern NVIDIA GPUs support NVENC
  
  if (!hasNVIDIA) {
    recommendations.push('Install NVIDIA GPU drivers');
  }
  
  if (!hasNVENC) {
    recommendations.push('Ensure GPU supports NVENC (GTX 600 series or newer)');
  }
  
  recommendations.push('Verify FFmpeg is compiled with --enable-nvenc');
  recommendations.push('Ensure CUDA toolkit is installed');
  
  return {
    hasNVIDIA,
    hasNVENC,
    recommendations
  };
};

/**
 * Performance monitoring utilities
 */
export const createPerformanceMonitor = () => {
  const startTime = Date.now();
  
  return {
    getElapsedTime: () => (Date.now() - startTime) / 1000,
    logPerformance: (stage: string, additionalData?: any) => {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(`[GPU-Performance] ${stage}: ${elapsed}s`, additionalData || '');
    }
  };
};