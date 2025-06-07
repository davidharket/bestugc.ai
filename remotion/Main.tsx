// remotion/Main.tsx
import { AbsoluteFill, Sequence } from 'remotion';
import { AdCreationData } from '../components/AdCreationContext';
import { Scene as SceneType } from '../lib/templates';
// Import all your new scene components
import { AvatarWithCornerImage } from './scenes/AvatarWithCornerImage';
import { FullScreenAsset } from './scenes/FullScreenAsset';
import { CutoutAvatarScene } from './scenes/CutoutAvatarScene';
import { SequentialLayeringScene } from './scenes/SequentialLayeringScene';

// Helper to get all assets in one array
const getAssets = (adData: AdCreationData) => [...(adData.selectedImages || []), ...(adData.selectedVideos || [])];

export const MainComposition: React.FC<{
  adData: AdCreationData;
  timeline: SceneType[];
  processedAvatarUrl: string; // Original with BG
  cutoutAvatarUrl: string;    // Transparent BG
}> = ({ adData, timeline, processedAvatarUrl, cutoutAvatarUrl }) => {

  if (!timeline || timeline.length === 0) {
    return (
        <AbsoluteFill className="bg-red-500 justify-center items-center">
            <h1 className="text-white text-4xl">Timeline not generated!</h1>
        </AbsoluteFill>
    );
  }

  let fromFrame = 0;

  return (
    <AbsoluteFill className="bg-white">
      {timeline.map((scene, index) => {
        const duration = scene.duration;
        const sceneComponent = (
          <Sequence key={index} from={fromFrame} durationInFrames={duration}>
            {renderScene(scene, adData, processedAvatarUrl, cutoutAvatarUrl)}
          </Sequence>
        );
        fromFrame += duration;
        return sceneComponent;
      })}
    </AbsoluteFill>
  );
};

// Main logic to switch between scene components
function renderScene(scene: SceneType, adData: AdCreationData, videoUrl: string, cutoutUrl: string) {
    const assets = getAssets(adData);
    const getAsset = (index?: number) => (index !== undefined ? assets[index] : '');

    switch (scene.layout) {
        case 'avatar-with-corner-image':
            return <AvatarWithCornerImage videoUrl={videoUrl} imageUrl={getAsset(scene.assetIndices?.[0])} />;

        case 'fullscreen-asset':
            return <FullScreenAsset assetUrl={getAsset(scene.assetIndices?.[0])} />;
        
        case 'cutout-center-over-asset':
            return <CutoutAvatarScene backgroundUrl={getAsset(scene.assetIndices?.[0])} cutoutUrl={cutoutUrl} position="center" />;

        case 'cutout-right-over-asset':
            return <CutoutAvatarScene backgroundUrl={getAsset(scene.assetIndices?.[0])} cutoutUrl={cutoutUrl} position="right" />;
            
        case 'cutout-left-over-asset':
            return <CutoutAvatarScene backgroundUrl={getAsset(scene.assetIndices?.[0])} cutoutUrl={cutoutUrl} position="left" />;

        case 'sequential-layering':
            const backgroundAssetIndex = scene.assetIndices?.[0];
            const layeringImages = (scene.assetIndices || []).slice(1).map(i => getAsset(i));
            return <SequentialLayeringScene backgroundUrl={getAsset(backgroundAssetIndex)} images={layeringImages} />;

        default:
            return <AbsoluteFill className="bg-yellow-400 justify-center items-center"><p>Unknown scene layout: {scene.layout}</p></AbsoluteFill>;
    }
}