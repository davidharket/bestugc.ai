// remotion/scenes/FullScreenAsset.tsx
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { DualLayerBackground } from '../components/DualLayerBackground';

interface FullScreenAssetProps {
  src: string;
}

export const FullScreenAsset: React.FC<FullScreenAssetProps> = ({ src }) => {
  const { } = useVideoConfig();
  
  if (!src) {
    return <AbsoluteFill style={{ backgroundColor: '#cccccc' }} />;
  }


  return (
    <AbsoluteFill className="bg-black">
      <DualLayerBackground 
        src={src}
        
      />
    </AbsoluteFill>
  );
};