import React from 'react';
import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import { z } from 'zod'; // Import Zod for schema validation

// --- Define Zod schema for props ---
const assetSchema = z.object({
  url: z.string(),
  duration: z.number().optional(),
  type: z.enum(['image', 'video']).optional(),
});

const timelineSegmentSchema = z.object({
  type: z.enum(['fullscreen_avatar', 'fullscreen_asset', 'avatar_with_corner', 'cutout_with_corner']),
  startFrame: z.number(),
  endFrame: z.number(),
  assetIndex: z.number().optional(),
});

export const WorkingAvatarMixScenePropsSchema = z.object({
  avatarUrl: z.string(),
  cutoutUrl: z.string().optional(),
  overlayAssets: z.array(assetSchema),
  timeline: z.array(timelineSegmentSchema),
});
// --- End Zod schema definition ---


// Enhanced video component with proper loading management (from your original file)
const RobustVideo: React.FC<{
  src: string;
  style?: React.CSSProperties;
  label?: string;
}> = ({ src, style = {}, label = "Video" }) => {
  const [handle] = React.useState(() => delayRender(`Loading video: ${src}`));
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn(`Video ${src} taking too long to load, continuing anyway`);
        continueRender(handle);
        setIsLoaded(true);
      }
    }, 60000); // 60 seconds timeout
    return () => clearTimeout(timeout);
  }, [handle, isLoaded, hasError, src]);

  const handleLoadedData = React.useCallback(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      continueRender(handle);
    }
  }, [handle, isLoaded]);

  const handleError = React.useCallback((e: any) => {
    console.error(`Video error for ${src}:`, e);
    setHasError(true);
    if (!isLoaded) {
      continueRender(handle);
      setIsLoaded(true);
    }
  }, [handle, isLoaded, src]);

  if (hasError) {
    return (
      <div
        style={{
          ...style,
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {label} (Error)
      </div>
    );
  }

  return (
    <Video
      src={src}
      style={style}
      muted
      playsInline
      onLoadedData={handleLoadedData}
      onError={handleError}
      onCanPlay={handleLoadedData}
    />
  );
};

// The component now uses the Zod-inferred type for its props
export const WorkingAvatarMixScene: React.FC<z.infer<typeof WorkingAvatarMixScenePropsSchema>> = (props) => {
  // Validate props at runtime and destructure them for use
  const { avatarUrl, cutoutUrl, overlayAssets, timeline } = WorkingAvatarMixScenePropsSchema.parse(props);
  const frame = useCurrentFrame();

  const ensureCorrectPort = (url: string) => {
    if (url.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***'}${url}`;
    }
    return url;
  };

  const currentSegment = timeline.find(
    segment => frame >= segment.startFrame && frame <= segment.endFrame
  );

  if (!currentSegment) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000' }}>
        <RobustVideo
          src={ensureCorrectPort(avatarUrl)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          label="Main Avatar"
        />
      </AbsoluteFill>
    );
  }

  const overlayAsset = currentSegment.assetIndex !== undefined
    ? overlayAssets[currentSegment.assetIndex]
    : null;

  // Render based on scene type (your original logic is preserved)
  switch (currentSegment.type) {
    case 'fullscreen_avatar':
      return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
          <RobustVideo
            src={ensureCorrectPort(avatarUrl)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            label="Main Avatar"
          />
        </AbsoluteFill>
      );

    case 'fullscreen_asset':
      if (!overlayAsset?.url) {
        return (
          <AbsoluteFill style={{ backgroundColor: '#000' }}>
            <RobustVideo
              src={avatarUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              label="Main Avatar (Fallback)"
            />
          </AbsoluteFill>
        );
      }
      return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
          <RobustVideo
            src={ensureCorrectPort(overlayAsset.url)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            label={`Asset ${currentSegment.assetIndex! + 1}`}
          />
        </AbsoluteFill>
      );

    case 'avatar_with_corner':
      return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
          <RobustVideo
            src={ensureCorrectPort(avatarUrl)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            label="Main Avatar"
          />
          {overlayAsset?.url && (
            <div style={{ position: 'absolute', top: '40px', right: '40px', width: '300px', height: '200px', borderRadius: '15px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
              <RobustVideo
                src={overlayAsset.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                label={`Asset ${currentSegment.assetIndex! + 1}`}
              />
            </div>
          )}
        </AbsoluteFill>
      );

    case 'cutout_with_corner':
      const mainSrc = cutoutUrl || avatarUrl;
      return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
          <RobustVideo
            src={mainSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            label={cutoutUrl ? "Cutout Avatar" : "Main Avatar"}
          />
          {overlayAsset?.url && (
            <div style={{ position: 'absolute', top: '40px', right: '40px', width: '300px', height: '200px', borderRadius: '15px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
              <RobustVideo
                src={overlayAsset.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                label={`Asset ${currentSegment.assetIndex! + 1}`}
              />
            </div>
          )}
        </AbsoluteFill>
      );

    default:
      return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
          <RobustVideo
            src={avatarUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            label="Main Avatar (Default)"
          />
        </AbsoluteFill>
      );
  }
};