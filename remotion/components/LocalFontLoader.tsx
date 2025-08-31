// remotion/components/LocalFontLoader.tsx
import { useEffect } from 'react';
import { delayRender, continueRender, staticFile, getInputProps } from 'remotion';

interface CustomFontData {
  id: string;
  name: string;
  fontFamily: string;
  uploadedFile: string;
}

// Load local fonts and custom uploaded fonts
export const loadLocalFonts = () => {
  const waitForFonts = delayRender('Loading Local Fonts');
  const inputProps = getInputProps();
  const customFontData = inputProps.customFontData as CustomFontData | null;

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

    // Load custom font if provided via inputProps
    if (customFontData) {
      try {
        console.log(`[LocalFontLoader] Loading custom font: ${customFontData.name}`);
        const customFont = new FontFace(
          customFontData.fontFamily,
          `url('${customFontData.uploadedFile}') format('woff'), url('${customFontData.uploadedFile}') format('truetype')`
        );

        const customFontPromise = customFont.load()
          .then(() => {
            document.fonts.add(customFont);
            console.log(`[LocalFontLoader] Custom font ${customFontData.name} loaded successfully`);
          })
          .catch((err) => {
            console.warn(`[LocalFontLoader] Error loading custom font ${customFontData.name}:`, err);
          });

        promises.push(customFontPromise);
      } catch (error) {
        console.warn(`[LocalFontLoader] Failed to create custom font ${customFontData.name}:`, error);
      }
    }
    
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