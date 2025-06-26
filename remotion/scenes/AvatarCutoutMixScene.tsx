// remotion/scenes/AvatarCutoutMixScene.tsx
import React from 'react';
import { AbsoluteFill, Video } from 'remotion';
import { z } from 'zod'; // Import Zod

// Define a schema for your props
const assetSchema = z.object({
  url: z.string(),
  type: z.enum(['image', 'video']).optional(),
});

const timelineSegmentSchema = z.object({
    type: z.enum(['fullscreen_avatar', 'fullscreen_asset', 'avatar_with_corner', 'cutout_with_corner']),
    startFrame: z.number(),
    endFrame: z.number(),
    assetIndex: z.number().optional(),
});

export const AvatarCutoutMixSceneProps = z.object({
  avatarUrl: z.string(),
  cutoutUrl: z.string().optional(),
  overlayAssets: z.array(assetSchema),
  timeline: z.array(timelineSegmentSchema),
});

// Use Zod's inferred type
export const AvatarCutoutMixScene: React.FC<z.infer<typeof AvatarCutoutMixSceneProps>> = (props) => {
  // Validate props at runtime
  const { avatarUrl, cutoutUrl, overlayAssets, timeline } = AvatarCutoutMixSceneProps.parse(props);
  const { useCurrentFrame, useVideoConfig } = require('remotion');
  const frame = useCurrentFrame();

  const currentSegment = timeline.find(
    (segment) => frame >= segment.startFrame && frame <= segment.endFrame
  );

  // ... (rest of your component logic remains the same)

  // Example of using the validated props
  if (!currentSegment) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000' }}>
        <Video src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
      </AbsoluteFill>
    );
  }

  const overlayAsset = currentSegment.assetIndex !== undefined ? overlayAssets[currentSegment.assetIndex] : null;

  // Render logic based on scene type...
  return (
    <AbsoluteFill>
      {/* Your existing rendering logic here, using the validated props */}
      <p style={{color: 'white', fontSize: 40}}>Rendering scene: {currentSegment.type}</p>
    </AbsoluteFill>
  );
};