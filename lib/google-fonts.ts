// lib/google-fonts.ts
// Comprehensive Google Fonts library for subtitle styles
// These are popular, high-quality fonts suitable for video subtitles

export interface FontConfig {
  id: string;
  name: string;
  fontFamily: string; // The CSS font-family value
  weights?: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace' | 'local' | 'custom';
  description: string;
  type: 'google' | 'local' | 'custom';
  // For Google Fonts
  importName?: string; // The actual Google Fonts import name
  // For local fonts
  localPath?: string;
  // For custom uploaded fonts
  uploadedFile?: string;
}

// Legacy interface for backward compatibility
export interface GoogleFontConfig extends FontConfig {
  importName: string;
  type: 'google';
}

// Google Fonts (will have type: 'google' added programmatically)
const GOOGLE_FONTS_BASE = [
  // Sans-serif fonts (most popular for videos)
  {
    id: 'inter',
    name: 'Inter',
    importName: 'Inter',
    fontFamily: 'Inter',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Modern, clean, and highly readable',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    importName: 'Roboto',
    fontFamily: 'Roboto',
    weights: ['400', '500', '700', '900'],
    category: 'sans-serif',
    description: 'Google\'s signature font, versatile and clear'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    importName: 'OpenSans',
    fontFamily: 'Open Sans',
    weights: ['400', '600', '700', '800'],
    category: 'sans-serif',
    description: 'Friendly and legible humanist font'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    importName: 'Montserrat',
    fontFamily: 'Montserrat',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Inspired by urban Buenos Aires typography'
  },
  {
    id: 'lato',
    name: 'Lato',
    importName: 'Lato',
    fontFamily: 'Lato',
    weights: ['400', '700', '900'],
    category: 'sans-serif',
    description: 'Warm yet stable, serious but friendly'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    importName: 'Poppins',
    fontFamily: 'Poppins',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Geometric sans-serif with rounded edges'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    importName: 'Nunito',
    fontFamily: 'Nunito',
    weights: ['400', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Well balanced sans-serif with rounded terminals'
  },
  {
    id: 'source-sans-pro',
    name: 'Source Sans Pro',
    importName: 'SourceSansPro',
    fontFamily: 'Source Sans Pro',
    weights: ['400', '600', '700', '900'],
    category: 'sans-serif',
    description: 'Adobe\'s first open source typeface family'
  },
  {
    id: 'raleway',
    name: 'Raleway',
    importName: 'Raleway',
    fontFamily: 'Raleway',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Elegant sans-serif family with 18 styles'
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    importName: 'Ubuntu',
    fontFamily: 'Ubuntu',
    weights: ['400', '500', '700'],
    category: 'sans-serif',
    description: 'Modern humanist font with personality'
  },
  
  // Display fonts (great for impact)
  {
    id: 'oswald',
    name: 'Oswald',
    importName: 'Oswald',
    fontFamily: 'Oswald',
    weights: ['400', '500', '600', '700'],
    category: 'display',
    description: 'Bold condensed font for headlines'
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    importName: 'BebasNeue',
    fontFamily: 'Bebas Neue',
    weights: ['400'],
    category: 'display',
    description: 'Bold condensed display font'
  },
  {
    id: 'anton',
    name: 'Anton',
    importName: 'Anton',
    fontFamily: 'Anton',
    weights: ['400'],
    category: 'display',
    description: 'Heavily weighted sans-serif'
  },
  {
    id: 'bangers',
    name: 'Bangers',
    importName: 'Bangers',
    fontFamily: 'Bangers',
    weights: ['400'],
    category: 'display',
    description: 'Comic book style lettering'
  },
  {
    id: 'fredoka-one',
    name: 'Fredoka One',
    importName: 'FredokaOne',
    fontFamily: 'Fredoka One',
    weights: ['400'],
    category: 'display',
    description: 'Playful rounded display font'
  },
  {
    id: 'impact',
    name: 'Archivo Black',
    importName: 'ArchivoBlack',
    fontFamily: 'Archivo Black',
    weights: ['400'],
    category: 'display',
    description: 'Bold condensed font similar to Impact'
  },
  {
    id: 'fjalla-one',
    name: 'Fjalla One',
    importName: 'FjallaOne',
    fontFamily: 'Fjalla One',
    weights: ['400'],
    category: 'display',
    description: 'Medium contrast display font'
  },
  {
    id: 'russo-one',
    name: 'Russo One',
    importName: 'RussoOne',
    fontFamily: 'Russo One',
    weights: ['400'],
    category: 'display',
    description: 'Balanced, modernized Bauhaus-style font'
  },
  
  // Serif fonts (elegant and readable)
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    importName: 'PlayfairDisplay',
    fontFamily: 'Playfair Display',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'serif',
    description: 'High-contrast serif with distinctive style'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    importName: 'Merriweather',
    fontFamily: 'Merriweather',
    weights: ['400', '700', '900'],
    category: 'serif',
    description: 'Designed for pleasant reading on screens'
  },
  {
    id: 'lora',
    name: 'Lora',
    importName: 'Lora',
    fontFamily: 'Lora',
    weights: ['400', '500', '600', '700'],
    category: 'serif',
    description: 'Well balanced serif with calligraphic roots'
  },
  
  // Handwriting/Script fonts (use sparingly)
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    importName: 'DancingScript',
    fontFamily: 'Dancing Script',
    weights: ['400', '500', '600', '700'],
    category: 'handwriting',
    description: 'Lively casual script font'
  },
  {
    id: 'great-vibes',
    name: 'Great Vibes',
    importName: 'GreatVibes',
    fontFamily: 'Great Vibes',
    weights: ['400'],
    category: 'handwriting',
    description: 'Elegant brush script font'
  },
  
  // Monospace fonts (technical content)
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    importName: 'SourceCodePro',
    fontFamily: 'Source Code Pro',
    weights: ['400', '500', '600', '700'],
    category: 'monospace',
    description: 'Readable monospaced font for code'
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    importName: 'JetBrainsMono',
    fontFamily: 'JetBrains Mono',
    weights: ['400', '500', '600', '700', '800'],
    category: 'monospace',
    description: 'Modern monospace font for developers'
  },

  // Additional popular fonts for social media content
  {
    id: 'quicksand',
    name: 'Quicksand',
    importName: 'Quicksand',
    fontFamily: 'Quicksand',
    weights: ['400', '500', '600', '700'],
    category: 'sans-serif',
    description: 'Friendly sans-serif with rounded characters'
  },
  {
    id: 'comfortaa',
    name: 'Comfortaa',
    importName: 'Comfortaa',
    fontFamily: 'Comfortaa',
    weights: ['400', '500', '600', '700'],
    category: 'display',
    description: 'Modern rounded geometric font'
  },
  {
    id: 'righteous',
    name: 'Righteous',
    importName: 'Righteous',
    fontFamily: 'Righteous',
    weights: ['400'],
    category: 'display',
    description: 'Casual script-inspired display font'
  },
  {
    id: 'cabin',
    name: 'Cabin',
    importName: 'Cabin',
    fontFamily: 'Cabin',
    weights: ['400', '500', '600', '700'],
    category: 'sans-serif',
    description: 'Humanist sans inspired by Edward Johnston'
  },
  {
    id: 'work-sans',
    name: 'Work Sans',
    importName: 'WorkSans',
    fontFamily: 'Work Sans',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Optimized for on-screen text at medium sizes'
  },
  
  // Additional Sans-serif fonts
  {
    id: 'dosis',
    name: 'Dosis',
    importName: 'Dosis',
    fontFamily: 'Dosis',
    weights: ['400', '500', '600', '700', '800'],
    category: 'sans-serif',
    description: 'Very simple, rounded sans-serif'
  },
  {
    id: 'fira-sans',
    name: 'Fira Sans',
    importName: 'FiraSans',
    fontFamily: 'Fira Sans',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Mozilla\'s humanist sans-serif'
  },
  {
    id: 'pt-sans',
    name: 'PT Sans',
    importName: 'PTSans',
    fontFamily: 'PT Sans',
    weights: ['400', '700'],
    category: 'sans-serif',
    description: 'Universal type family for diverse languages'
  },
  {
    id: 'mulish',
    name: 'Mulish',
    importName: 'Mulish',
    fontFamily: 'Mulish',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Friendly and readable sans-serif'
  },
  {
    id: 'karla',
    name: 'Karla',
    importName: 'Karla',
    fontFamily: 'Karla',
    weights: ['400', '500', '600', '700', '800'],
    category: 'sans-serif',
    description: 'Grotesque sans-serif with subtle rounded corners'
  },
  {
    id: 'barlow',
    name: 'Barlow',
    importName: 'Barlow',
    fontFamily: 'Barlow',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Slightly rounded, low-contrast grotesk'
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    importName: 'DMSans',
    fontFamily: 'DM Sans',
    weights: ['400', '500', '700'],
    category: 'sans-serif',
    description: 'Low-contrast geometric sans-serif'
  },
  {
    id: 'rubik',
    name: 'Rubik',
    importName: 'Rubik',
    fontFamily: 'Rubik',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Slightly rounded sans-serif'
  },
  {
    id: 'heebo',
    name: 'Heebo',
    importName: 'Heebo',
    fontFamily: 'Heebo',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
    description: 'Hebrew-Latin bilingual font family'
  },
  {
    id: 'manrope',
    name: 'Manrope',
    importName: 'Manrope',
    fontFamily: 'Manrope',
    weights: ['400', '500', '600', '700', '800'],
    category: 'sans-serif',
    description: 'Modern geometric sans-serif'
  },

  // More Display fonts
  {
    id: 'pacifico',
    name: 'Pacifico',
    importName: 'Pacifico',
    fontFamily: 'Pacifico',
    weights: ['400'],
    category: 'display',
    description: 'Surfer-style brush script'
  },
  {
    id: 'lobster',
    name: 'Lobster',
    importName: 'Lobster',
    fontFamily: 'Lobster',
    weights: ['400'],
    category: 'display',
    description: 'Bold condensed script with flair'
  },
  {
    id: 'alfa-slab-one',
    name: 'Alfa Slab One',
    importName: 'AlfaSlabOne',
    fontFamily: 'Alfa Slab One',
    weights: ['400'],
    category: 'display',
    description: 'Bold condensed slab serif'
  },
  {
    id: 'bungee',
    name: 'Bungee',
    importName: 'Bungee',
    fontFamily: 'Bungee',
    weights: ['400'],
    category: 'display',
    description: 'Bold display font for signage'
  },
  {
    id: 'black-ops-one',
    name: 'Black Ops One',
    importName: 'BlackOpsOne',
    fontFamily: 'Black Ops One',
    weights: ['400'],
    category: 'display',
    description: 'Military stencil-style font'
  },
  {
    id: 'permanent-marker',
    name: 'Permanent Marker',
    importName: 'PermanentMarker',
    fontFamily: 'Permanent Marker',
    weights: ['400'],
    category: 'display',
    description: 'Hand-drawn marker font'
  },
  {
    id: 'creepster',
    name: 'Creepster',
    importName: 'Creepster',
    fontFamily: 'Creepster',
    weights: ['400'],
    category: 'display',
    description: 'Spooky horror-themed font'
  },
  {
    id: 'orbitron',
    name: 'Orbitron',
    importName: 'Orbitron',
    fontFamily: 'Orbitron',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'display',
    description: 'Futuristic sci-fi font'
  },
  {
    id: 'press-start-2p',
    name: 'Press Start 2P',
    importName: 'PressStart2P',
    fontFamily: 'Press Start 2P',
    weights: ['400'],
    category: 'display',
    description: '8-bit video game font'
  },
  {
    id: 'kalam',
    name: 'Kalam',
    importName: 'Kalam',
    fontFamily: 'Kalam',
    weights: ['400', '700'],
    category: 'display',
    description: 'Handwritten casual font'
  },

  // More Serif fonts
  {
    id: 'eb-garamond',
    name: 'EB Garamond',
    importName: 'EBGaramond',
    fontFamily: 'EB Garamond',
    weights: ['400', '500', '600', '700', '800'],
    category: 'serif',
    description: 'Classical Garamond revival'
  },
  {
    id: 'libre-baskerville',
    name: 'Libre Baskerville',
    importName: 'LibreBaskerville',
    fontFamily: 'Libre Baskerville',
    weights: ['400', '700'],
    category: 'serif',
    description: 'Classic serif based on American Type Founder\'s Baskerville'
  },
  {
    id: 'cormorant-garamond',
    name: 'Cormorant Garamond',
    importName: 'CormorantGaramond',
    fontFamily: 'Cormorant Garamond',
    weights: ['400', '500', '600', '700'],
    category: 'serif',
    description: 'Display serif inspired by Claude Garamond'
  },
  {
    id: 'crimson-text',
    name: 'Crimson Text',
    importName: 'CrimsonText',
    fontFamily: 'Crimson Text',
    weights: ['400', '600', '700'],
    category: 'serif',
    description: 'Inspired by old-style serif typefaces'
  },
  {
    id: 'vollkorn',
    name: 'Vollkorn',
    importName: 'Vollkorn',
    fontFamily: 'Vollkorn',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'serif',
    description: 'Quiet, modest serif for bread text'
  },
  {
    id: 'bitter',
    name: 'Bitter',
    importName: 'Bitter',
    fontFamily: 'Bitter',
    weights: ['400', '500', '600', '700', '800'],
    category: 'serif',
    description: 'Contemporary slab serif typeface'
  },
  {
    id: 'zilla-slab',
    name: 'Zilla Slab',
    importName: 'ZillaSlab',
    fontFamily: 'Zilla Slab',
    weights: ['400', '500', '600', '700'],
    category: 'serif',
    description: 'Mozilla\'s Typotheque-designed slab serif'
  },

  // More Handwriting fonts
  {
    id: 'sacramento',
    name: 'Sacramento',
    importName: 'Sacramento',
    fontFamily: 'Sacramento',
    weights: ['400'],
    category: 'handwriting',
    description: 'Monoline script inspired by hand lettering'
  },
  {
    id: 'allura',
    name: 'Allura',
    importName: 'Allura',
    fontFamily: 'Allura',
    weights: ['400'],
    category: 'handwriting',
    description: 'Flowing calligraphy script'
  },
  {
    id: 'satisfy',
    name: 'Satisfy',
    importName: 'Satisfy',
    fontFamily: 'Satisfy',
    weights: ['400'],
    category: 'handwriting',
    description: 'Hand-lettered casual script'
  },
  {
    id: 'caveat',
    name: 'Caveat',
    importName: 'Caveat',
    fontFamily: 'Caveat',
    weights: ['400', '500', '600', '700'],
    category: 'handwriting',
    description: 'Casual handwritten font'
  },
  {
    id: 'amatic-sc',
    name: 'Amatic SC',
    importName: 'AmaticSC',
    fontFamily: 'Amatic SC',
    weights: ['400', '700'],
    category: 'handwriting',
    description: 'Hand-drawn webfont family'
  },

  // More Monospace fonts
  {
    id: 'fira-code',
    name: 'Fira Code',
    importName: 'FiraCode',
    fontFamily: 'Fira Code',
    weights: ['400', '500', '600', '700'],
    category: 'monospace',
    description: 'Monospaced font with programming ligatures'
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    importName: 'Inconsolata',
    fontFamily: 'Inconsolata',
    weights: ['400', '500', '600', '700', '800', '900'],
    category: 'monospace',
    description: 'Humanist monospace for programmers'
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    importName: 'SpaceMono',
    fontFamily: 'Space Mono',
    weights: ['400', '700'],
    category: 'monospace',
    description: 'Quirky monospace font for creative coding'
  }
];

// Local fonts available on the system
const LOCAL_FONTS: FontConfig[] = [
  {
    id: 'bold-font',
    name: 'The Bold Font (Default)',
    fontFamily: 'The Bold Font, Arial Black, sans-serif',
    weights: ['900'],
    category: 'local',
    description: 'Ultra-bold local font perfect for video subtitles',
    type: 'local',
    localPath: '/fonts/THEBOLDFONT-FREEVERSION.woff'
  },
  {
    id: 'system-font',
    name: 'System Font',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    weights: ['400', '600', '700'],
    category: 'local',
    description: 'Native system font stack',
    type: 'local'
  }
];

// Convert Google fonts base to include type
export const GOOGLE_FONTS_LIBRARY: GoogleFontConfig[] = GOOGLE_FONTS_BASE.map(font => ({
  ...font,
  type: 'google' as const,
  category: font.category as GoogleFontConfig['category']
}));

// Combined font library including Google fonts, local fonts, and custom fonts
export const ALL_FONTS_LIBRARY: FontConfig[] = [
  ...LOCAL_FONTS,
  ...GOOGLE_FONTS_LIBRARY
];

// Helper function to get font by ID from any source
export function getFontById(id: string): FontConfig | undefined {
  return ALL_FONTS_LIBRARY.find(font => font.id === id);
}

// Legacy function for backward compatibility
export function getGoogleFont(id: string): GoogleFontConfig | undefined {
  return GOOGLE_FONTS_LIBRARY.find(font => font.id === id);
}

// Helper function to get fonts by category (all fonts)
export function getFontsByCategory(category: FontConfig['category']): FontConfig[] {
  return ALL_FONTS_LIBRARY.filter(font => font.category === category);
}

// Helper function to get fonts by type
export function getFontsByType(type: FontConfig['type']): FontConfig[] {
  return ALL_FONTS_LIBRARY.filter(font => font.type === type);
}

// Legacy helper function for backward compatibility
export function getGoogleFontsByCategory(category: GoogleFontConfig['category']): GoogleFontConfig[] {
  return GOOGLE_FONTS_LIBRARY.filter(font => font.category === category);
}

// Add custom font to the library (for uploaded fonts)
let customFonts: FontConfig[] = [];

export function addCustomFont(font: FontConfig): void {
  customFonts.push(font);
}

export function getCustomFonts(): FontConfig[] {
  return customFonts;
}

export function getAllAvailableFonts(): FontConfig[] {
  return [...ALL_FONTS_LIBRARY, ...customFonts];
}

// Default font fallbacks for each category
export const FONT_FALLBACKS = {
  'sans-serif': ', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  'serif': ', Georgia, "Times New Roman", Times, serif',
  'display': ', Impact, "Franklin Gothic Bold", Arial Black, sans-serif',
  'handwriting': ', cursive',
  'monospace': ', "Courier New", Courier, monospace',
  'local': ', sans-serif',
  'custom': ', sans-serif'
};