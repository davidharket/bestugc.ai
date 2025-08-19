// remotion/components/LocalFontLoader.tsx
import { useEffect } from 'react';
import { delayRender, continueRender, staticFile } from 'remotion';

// Load local fonts and custom uploaded fonts
export const loadLocalFonts = () => {
  const waitForFonts = delayRender('Loading Local Fonts');

  // Only load font in browser environment
  if (typeof window !== 'undefined' && 'FontFace' in window) {
    const promises: Promise<void>[] = [];

    // Load The Bold Font
    try {
      const boldFont = new FontFace(
        'The Bold Font',
        `url('${staticFile("fonts/THEBOLDFONT-FREEVERSION.woff")}') format('woff')`,
      );

      const boldFontPromise = boldFont.load()
        .then(() => {
          document.fonts.add(boldFont);
          console.log('The Bold Font loaded successfully');
        })
        .catch((err) => {
          console.warn('Error loading The Bold Font:', err);
        });

      promises.push(boldFontPromise);
    } catch (error) {
      console.warn('Failed to create The Bold Font:', error);
    }

    // Custom fonts should be loaded in the browser, not during Remotion rendering
    // They will be available if already loaded by the frontend
    
    Promise.all(promises)
      .then(() => {
        console.log('All local fonts loaded successfully!');
        continueRender(waitForFonts);
      })
      .catch((err) => {
        console.error('Error loading some local fonts:', err);
        continueRender(waitForFonts);
      });

  } else {
    // In server environment, just continue render
    continueRender(waitForFonts);
  }
};

// Component to trigger local font loading
export const LocalFontLoader: React.FC = () => {
  useEffect(() => {
    loadLocalFonts();
  }, []);

  return null;
};