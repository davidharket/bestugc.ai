// lib/custom-font-loader.ts
// Client-side custom font loader for the font selection interface

export interface CustomFont {
  id: string;
  name: string;
  fontFamily: string;
  uploadedFile: string;
  uploadedAt: Date;
}

class CustomFontManager {
  private loadedFonts: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  async loadCustomFonts(): Promise<CustomFont[]> {
    try {
      const response = await fetch('/api/fonts/list');
      if (response.ok) {
        const data = await response.json();
        const customFonts = data.fonts || [];

        // Load each custom font
        await Promise.all(
          customFonts.map((font: CustomFont) => this.loadSingleFont(font))
        );

        return customFonts;
      }
      return [];
    } catch (error) {
      console.warn('Failed to load custom fonts:', error);
      return [];
    }
  }

  private async loadSingleFont(font: CustomFont): Promise<void> {
    if (this.loadedFonts.has(font.id)) {
      return; // Already loaded
    }

    if (this.loadingPromises.has(font.id)) {
      return this.loadingPromises.get(font.id);
    }

    const loadPromise = this.doLoadFont(font);
    this.loadingPromises.set(font.id, loadPromise);

    try {
      await loadPromise;
      this.loadedFonts.add(font.id);
    } catch (error) {
      this.loadingPromises.delete(font.id);
      throw error;
    }

    return loadPromise;
  }

  private async doLoadFont(font: CustomFont): Promise<void> {
    if (typeof window === 'undefined' || !('FontFace' in window)) {
      throw new Error('FontFace API not available');
    }

    try {
      const customFont = new FontFace(
        font.fontFamily,
        `url('${font.uploadedFile}')`
      );

      await customFont.load();
      document.fonts.add(customFont);
      console.log(`Custom font ${font.name} loaded successfully`);
    } catch (error) {
      console.warn(`Error loading custom font ${font.name}:`, error);
      throw error;
    }
  }

  isLoaded(fontId: string): boolean {
    return this.loadedFonts.has(fontId);
  }

  async ensureFontLoaded(font: CustomFont): Promise<void> {
    return this.loadSingleFont(font);
  }
}

// Singleton instance
const customFontManager = new CustomFontManager();
export default customFontManager;