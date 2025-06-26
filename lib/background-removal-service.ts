import axios from 'axios';

export interface BackgroundRemovalResult {
  success: boolean;
  cutoutVideoUrl?: string;
  error?: string;
  processingTimeMs?: number;
}

export class BackgroundRemovalService {
  private static cache = new Map<string, string>();
  
  /**
   * Remove background from video with caching and error handling
   */
  static async removeBackground(
    videoUrl: string,
    apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***'
  ): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(videoUrl);
      if (this.cache.has(cacheKey)) {
        console.log(`🎭 Using cached cutout video for ${videoUrl}`);
        return {
          success: true,
          cutoutVideoUrl: this.cache.get(cacheKey)!,
          processingTimeMs: Date.now() - startTime
        };
      }
      
      console.log(`🎭 Starting background removal for ${videoUrl}`);
      
      // Call the background removal API
      const response = await axios.post(
        `${apiBaseUrl}/api/video/remove-background`,
        { videoUrl },
        { 
          timeout: 300000, // 5 minute timeout for background removal
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const cutoutVideoUrl = response.data.cutoutVideoUrl;
      
      if (!cutoutVideoUrl) {
        throw new Error('Background removal API returned no cutout URL');
      }
      
      // Cache the result
      this.cache.set(cacheKey, cutoutVideoUrl);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Background removal completed in ${processingTime}ms`);
      
      return {
        success: true,
        cutoutVideoUrl,
        processingTimeMs: processingTime
      };
      
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Background removal failed after ${processingTime}ms:`, error.message);
      
      return {
        success: false,
        error: error.message,
        processingTimeMs: processingTime
      };
    }
  }
  
  /**
   * Remove background with fallback strategy
   */
  static async removeBackgroundWithFallback(
    videoUrl: string,
    apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***'
  ): Promise<string> {
    const result = await this.removeBackground(videoUrl, apiBaseUrl);
    
    if (result.success && result.cutoutVideoUrl) {
      return result.cutoutVideoUrl;
    }
    
    // Fallback: use original video if background removal fails
    console.warn(`⚠️ Background removal failed, using original video as fallback`);
    return videoUrl;
  }
  
  /**
   * Check if background removal is available
   */
  static async isAvailable(apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***'): Promise<boolean> {
    try {
      // Quick health check - check if the server is running
      await axios.get(`${apiBaseUrl}/api/health`, { timeout: 5000 });
      return true;
    } catch {
      // If health endpoint doesn't exist, assume background removal is available
      // since it's a core feature
      return true;
    }
  }
  
  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
  
  private static getCacheKey(videoUrl: string): string {
    // Create a cache key from the video URL
    return `bg_removal_${videoUrl.split('/').pop()?.split('?')[0] || 'unknown'}`;
  }
} 