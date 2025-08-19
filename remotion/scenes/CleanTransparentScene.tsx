// remotion/scenes/CleanTransparentScene.tsx
import React from 'react';
import { AbsoluteFill, Video, delayRender, continueRender } from 'remotion';
import { z } from 'zod'; // Import Zod

// Define a schema for your props
export const CleanTransparentSceneProps = z.object({
  mainVideoUrl: z.string(),
  overlayVideoUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
});

// Use Zod's inferred type
export const CleanTransparentScene: React.FC<z.infer<typeof CleanTransparentSceneProps>> = (props) => {
    // Validate props at runtime
  const { mainVideoUrl, overlayVideoUrl, backgroundColor } = CleanTransparentSceneProps.parse(props);
  const { useCurrentFrame, useVideoConfig } = require('remotion');
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Your existing component logic here...
  const showOverlay = overlayVideoUrl && frame > durationInFrames / 2;

  // Simple video component from your file
    const SimpleVideo: React.FC<{ src: string }> = ({ src }) => {
        const [handle] = React.useState(() => delayRender());
        React.useEffect(() => {
            continueRender(handle);
        }, [handle]);
        return <Video src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} muted/>
    }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor || '#ffffff' }}>
      <SimpleVideo src={mainVideoUrl} />
      {showOverlay && (
        <div style={{ position: 'absolute', top: 40, right: 40, width: 300, height: 200 }}>
          <SimpleVideo src={overlayVideoUrl} />
        </div>
      )}
    </AbsoluteFill>
  );
};