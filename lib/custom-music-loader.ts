// lib/custom-music-loader.ts
import axios from 'axios';

export interface CustomMusic {
  id: string;
  name: string;
  url: string;
  originalFilename: string;
  uploadedAt: string;
}

class CustomMusicManager {
  private musicCache: CustomMusic[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async loadCustomMusic(): Promise<CustomMusic[]> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.musicCache.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.musicCache;
    }

    try {
      console.log('🎵 Fetching custom music list...');
      const response = await axios.get('/api/music/list');
      
      if (response.data.success) {
        this.musicCache = response.data.music || [];
        this.lastFetch = now;
        console.log(`✅ Loaded ${this.musicCache.length} custom music files`);
        return this.musicCache;
      } else {
        console.error('❌ Failed to load custom music:', response.data.error);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Error loading custom music:', error?.response?.data?.error || error.message);
      // Return cached data if available, otherwise empty array
      return this.musicCache || [];
    }
  }

  // Clear cache to force refresh on next load
  clearCache(): void {
    console.log('🗑️ Clearing custom music cache');
    this.musicCache = [];
    this.lastFetch = 0;
  }

  // Get cached music without making API call
  getCachedMusic(): CustomMusic[] {
    return this.musicCache;
  }

  // Add newly uploaded music to cache
  addToCache(music: CustomMusic): void {
    console.log('➕ Adding music to cache:', music.name);
    this.musicCache.unshift(music); // Add to beginning (most recent first)
  }

  // Check if music exists in cache
  hasCachedMusic(): boolean {
    return this.musicCache.length > 0;
  }

  // Get music by ID
  getMusicById(id: string): CustomMusic | undefined {
    return this.musicCache.find(music => music.id === id);
  }

  // Remove music from cache (useful if delete functionality is added later)
  removeFromCache(id: string): void {
    console.log('➖ Removing music from cache:', id);
    this.musicCache = this.musicCache.filter(music => music.id !== id);
  }
}

// Export singleton instance
const customMusicManager = new CustomMusicManager();
export default customMusicManager;