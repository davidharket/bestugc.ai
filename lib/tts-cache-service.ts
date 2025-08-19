// lib/tts-cache-service.ts
import axios from 'axios';

interface TTSResult {
  audioUrl: string;
  wordTimings: Array<{ word: string; startTime: number; endTime: number; }>;
}

interface CacheEntry {
  result: TTSResult;
  timestamp: number;
}

class TTSCacheService {
  private static cache = new Map<string, CacheEntry>();
  private static activeRequests = new Map<string, Promise<TTSResult>>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private static createCacheKey(script: string, language: string, gender: string, avatarId?: number): string {
    // Create a shorter hash-based key to avoid URL length issues
    const content = `${script}_${language}_${gender}_${avatarId || 'none'}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `tts_${Math.abs(hash).toString(36)}`;
  }

  private static isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_DURATION;
  }

  private static async makeAPICall(script: string, language: string, gender: string, avatarId?: number): Promise<TTSResult> {
    console.log('[TTS Cache] Making API call for:', { script: script.substring(0, 50) + '...', language, gender, avatarId });
    
    const response = await axios.post('/api/tts/elevenlabs', {
      text: script,
      language,
      gender,
      avatarId,
      withTimestamps: true
    });

    return {
      audioUrl: response.data.audioUrl,
      wordTimings: response.data.wordTimings || []
    };
  }

  static async getTTS(script: string, language: string, gender: string, avatarId?: number): Promise<TTSResult> {
    if (!script || !language || !gender) {
      throw new Error('Missing required parameters for TTS generation');
    }

    const cacheKey = this.createCacheKey(script, language, gender, avatarId);
    console.log('[TTS Cache] Request for cache key:', cacheKey);

    // Check cache first
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      console.log('[TTS Cache] Cache hit for key:', cacheKey);
      return cachedEntry.result;
    }

    // Clean expired cache entry
    if (cachedEntry && !this.isCacheValid(cachedEntry)) {
      console.log('[TTS Cache] Removing expired cache entry:', cacheKey);
      this.cache.delete(cacheKey);
    }

    // Check if there's already an active request for this key (deduplication)
    const activeRequest = this.activeRequests.get(cacheKey);
    if (activeRequest) {
      console.log('[TTS Cache] Deduplicating request for key:', cacheKey);
      return activeRequest;
    }

    // Create new request
    console.log('[TTS Cache] Cache miss, making new request for key:', cacheKey);
    const requestPromise = this.makeAPICall(script, language, gender, avatarId);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      console.log('[TTS Cache] Cached result for key:', cacheKey);
      return result;
    } catch (error) {
      console.error('[TTS Cache] API call failed for key:', cacheKey, error);
      throw error;
    } finally {
      // Always clean up active request
      this.activeRequests.delete(cacheKey);
    }
  }

  static clearCache(): void {
    console.log('[TTS Cache] Clearing all cache');
    this.cache.clear();
    this.activeRequests.clear();
  }

  static getCacheStats() {
    let validCount = 0;
    this.cache.forEach((entry) => {
      if (this.isCacheValid(entry)) {
        validCount++;
      }
    });
    
    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      activeRequests: this.activeRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }

  // Clean up expired entries periodically
  static cleanupExpiredEntries(): void {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (!this.isCacheValid(entry)) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log('[TTS Cache] Cleaned up expired entries:', expiredKeys.length);
    }
  }
}

// Clean up expired entries every 30 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    TTSCacheService.cleanupExpiredEntries();
  }, 30 * 60 * 1000);
}

export default TTSCacheService;