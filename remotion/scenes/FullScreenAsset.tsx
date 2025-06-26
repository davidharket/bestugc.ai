// remotion/scenes/FullScreenAsset.tsx
import { AbsoluteFill, Img, Video } from 'remotion';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const FullScreenAsset: React.FC<{ src: string }> = ({ src }) => {
  if (!src) {
    return <AbsoluteFill style={{ backgroundColor: '#cccccc' }} />;
  }

  // --- THE FIX: Explicit styling to guarantee "cover" behavior ---
  const coverStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };
  // --- END OF FIX ---

  return (
    <AbsoluteFill className="bg-black justify-center items-center">
      {isVideo(src) ? (
        <Video src={src} style={coverStyle} muted />
      ) : (
        <Img src={src} style={coverStyle} />
      )}
    </AbsoluteFill>
  );
};