// remotion/scenes/FullScreenAsset.tsx
import { AbsoluteFill, Img, Video } from 'remotion';
import { LoopingVideo } from '../components/LoopingVideo';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const FullScreenAsset: React.FC<{ src: string; videoDurationInFrames?: number }> = ({ src, videoDurationInFrames = 300 }) => {
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
        <LoopingVideo 
          src={src} 
          style={coverStyle} 
          videoDurationInFrames={videoDurationInFrames}
          muted 
          playsInline={true} 
          preload="metadata" 
        />
      ) : (
        <Img src={src} style={coverStyle} />
      )}
    </AbsoluteFill>
  );
};