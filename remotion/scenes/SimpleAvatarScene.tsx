// remotion/scenes/SimpleAvatarScene.tsx
import React from 'react';
import { AbsoluteFill, Video } from 'remotion';
import { z } from 'zod'; // Import Zod

// Define a schema for your props
export const SimpleAvatarSceneProps = z.object({
  avatarUrl: z.string(),
});

// Use Zod's inferred type for strong typing inside the component
export const SimpleAvatarScene: React.FC<z.infer<typeof SimpleAvatarSceneProps>> = (props) => {
  // Validate props at runtime
  const { avatarUrl } = SimpleAvatarSceneProps.parse(props);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Video
        src={avatarUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        muted
        playsInline
      />
    </AbsoluteFill>
  );
};