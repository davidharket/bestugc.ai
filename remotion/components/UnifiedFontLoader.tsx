// remotion/components/UnifiedFontLoader.tsx
import React from 'react';
import { staticFile } from 'remotion';

// Server-compatible font loading using CSS @font-face
export const UnifiedFontLoader: React.FC = () => {
  // Generate @font-face CSS for local fonts
  const fontFaceCSS = `
    @font-face {
      font-family: 'The Bold Font';
      src: url('${staticFile("fonts/THEBOLDFONT-FREEVERSION.woff")}') format('woff');
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }
    
    @font-face {
      font-family: 'System Font';
      src: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 700;
      font-style: normal;
    }
  `;

  return (
    <style dangerouslySetInnerHTML={{ __html: fontFaceCSS }} />
  );
};