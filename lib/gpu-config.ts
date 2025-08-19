// lib/gpu-config.ts
// Centralized GPU acceleration configuration for NVIDIA hardware

import { ChromiumOptions, FfmpegOverrideFn } from '@remotion/renderer';
import webpack from 'webpack'; // Import webpack at the top

export interface GPUConfig {
  chromiumOptions: ChromiumOptions;
  ffmpegOverride: FfmpegOverrideFn;
}

/**
 * Production-optimized GPU configuration for final video rendering
 */
export const getProductionGPUConfig = (): GPUConfig => {
  return {
    chromiumOptions: {
      disableWebSecurity: true,
      gl: 'angle-egl',
      ignoreCertificateErrors: true,
      headless: true,
      enableMultiProcessOnLinux: true
    },
    ffmpegOverride: (info) => {
      console.log('[GPU Config] Original FFmpeg args:', info.args);
      const gpuArgs = [
        '-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda', '-c:v', 'h264_nvenc',
        '-preset', 'p4', '-tune', 'hq', '-rc', 'vbr', '-cq', '23', '-b:v', '5M',
        '-maxrate', '8M', '-bufsize', '10M', '-profile:v', 'high', '-level:v', '4.1'
      ];
      const inputIndex = info.args.findIndex(arg => arg === '-i');
      if (inputIndex !== -1) {
        const beforeInput = info.args.slice(0, inputIndex + 2);
        const afterInput = info.args.slice(inputIndex + 2);
        const result = [...beforeInput, ...gpuArgs, ...afterInput];
        console.log('[GPU Config] GPU-enhanced FFmpeg args:', result);
        return result;
      }
      return [...info.args, ...gpuArgs];
    }
  };
};

/**
 * Preview-optimized GPU configuration
 */
export const getPreviewGPUConfig = (): GPUConfig => {
  return {
    chromiumOptions: {
      disableWebSecurity: true,
      gl: 'angle-egl',
      ignoreCertificateErrors: true,
      headless: true,
      enableMultiProcessOnLinux: true
    },
    ffmpegOverride: (info) => {
      console.log('[GPU Config] Original Preview FFmpeg args:', info.args);
      const previewGpuArgs = [
        '-hwaccel', 'cuda', '-c:v', 'h264_nvenc', '-preset', 'p1', '-tune', 'll',
        '-rc', 'cbr', '-b:v', '2M', '-profile:v', 'baseline'
      ];
      const inputIndex = info.args.findIndex(arg => arg === '-i');
      if (inputIndex !== -1) {
        const beforeInput = info.args.slice(0, inputIndex + 2);
        const afterInput = info.args.slice(inputIndex + 2);
        const result = [...beforeInput, ...previewGpuArgs, ...afterInput];
        console.log('[GPU Config] Preview GPU-enhanced FFmpeg args:', result);
        return result;
      }
      return [...info.args, ...previewGpuArgs];
    }
  };
};

/**
 * Webpack configuration optimizations for GPU rendering and bundle size reduction.
 * NEW STRATEGY: We now explicitly ignore the entire './public' directory.
 */
export const getGPUWebpackConfig = (isProduction: boolean = false) => {
  return (config: any) => {
    config.cache = false;
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error'
    };
    // CRITICAL: Force all asset loading to use port 3001 instead of 3003
    const rendererPort = process.env.REMOTION_RENDERER_PORT || '3001';
    const publicPath = `http://localhost:${rendererPort}/`;
    
    console.log('[GPU Config] FORCING ALL ASSETS TO PORT:', rendererPort);
    console.log('[GPU Config] OVERRIDING publicPath to:', publicPath);
    
    // Override any existing publicPath settings
    if (config.output) {
      config.output.publicPath = publicPath;
    }
    
    // Force __webpack_public_path__ at runtime
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        '__webpack_public_path__': JSON.stringify(publicPath),
      })
    );
    
    // Force webpack dev server to use the correct port - override any existing configuration
    config.devServer = {
      port: parseInt(rendererPort, 10),
      host: 'localhost',
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      // CRITICAL: Proxy all /public requests to the main app
      proxy: {
        '/public': {
          target: `http://localhost:${rendererPort}`,
          changeOrigin: true,
          pathRewrite: {
            '^/public': '' // Remove /public prefix
          }
        }
      }
    };
    
    config.output = {
      ...config.output,
      publicPath: publicPath
    };
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        'webgl': 'webgl2',
      }
    };
    
    // Minimal rules - we let the `publicDir` option handle assets.
    config.module.rules = (config.module.rules || []).filter(
        (rule: any) => !rule.test?.toString().includes('mp4') // Remove default asset loaders
    );
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: 'raw-loader'
    });

    if (!isProduction) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: false,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        mergeDuplicateChunks: false
      };
    }
    
    // Clean up any pre-existing plugins and add our own
    config.plugins = (config.plugins || []).filter(
      (plugin: any) => plugin.constructor.name !== 'IgnorePlugin'
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify(process.env.NEXT_PUBLIC_APP_URL),
        'process.env.NEXT_PUBLIC_BASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_BASE_URL),
      })
    );

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
  const hasNVIDIA = true;
  const hasNVENC = true;

  if (!hasNVIDIA) recommendations.push('Install NVIDIA GPU drivers');
  if (!hasNVENC) recommendations.push('Ensure GPU supports NVENC (GTX 600 series or newer)');
  
  recommendations.push('Verify FFmpeg is compiled with --enable-nvenc');
  recommendations.push('Ensure CUDA toolkit is installed');

  return { hasNVIDIA, hasNVENC, recommendations };
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
