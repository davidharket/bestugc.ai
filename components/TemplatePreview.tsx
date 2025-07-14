// components/TemplatePreview.tsx
import React, { useState, useEffect } from 'react';
import { VideoTemplate, LayoutType } from '../lib/templates';
import { avatars } from '../lib/avatars';

interface TemplatePreviewProps {
  template: VideoTemplate;
  assets: string[];
  avatarId: number;
  className?: string;
}

interface ScenePreviewProps {
  layout: LayoutType;
  asset?: string;
  avatarSrc: string;
  isActive: boolean;
}

const ScenePreview: React.FC<ScenePreviewProps> = ({ layout, asset, avatarSrc, isActive }) => {
  const handleAssetLoad = (src: string) => {
    // Handle asset loading completion
    console.log('Asset loaded:', src);
  };

  const isVideo = (src: string) => {
    if (!src) return false;
    return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
  };

  const getLayoutStyles = () => {
    const baseContainer = "relative w-full h-full overflow-hidden rounded-lg bg-gray-900";
    const avatarStyle = "absolute bottom-0 w-auto object-cover object-bottom";
    
    switch (layout) {
      case 'fullscreen-avatar':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "",
          assetContainer: ""
        };
      
      case 'fullscreen-asset':
        return {
          container: baseContainer,
          avatar: "",
          asset: "w-full h-full object-cover",
          assetContainer: "w-full h-full"
        };
      
      case 'cutout-left-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 left-0`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0"
        };
      
      case 'cutout-right-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 right-0`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0"
        };
      
      case 'cutout-center-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 left-1/2 transform -translate-x-1/2`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0"
        };
      
      case 'avatar-with-corner-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "w-full h-full object-cover rounded-lg border-2 border-white/20",
          assetContainer: "absolute top-2 right-2 w-1/3 h-1/3 z-10"
        };
      
      case 'split-screen-top-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute top-0 left-0 w-full h-1/2"
        };
      
      case 'buildup-collage':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-2/3 right-0`,
          asset: "w-full h-full object-cover rounded-lg",
          assetContainer: "absolute top-2 left-2 w-1/2 h-1/2"
        };
      
      default:
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "",
          assetContainer: ""
        };
    }
  };

  const styles = getLayoutStyles();

  return (
    <div className={`${styles.container} ${isActive ? 'ring-2 ring-orange-500' : ''}`}>
      {/* Avatar Layer (base layer) */}
      {styles.avatar && (
        <video
          src={avatarSrc}
          className={styles.avatar}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          style={{ pointerEvents: 'none' }}
          onLoadedData={() => handleAssetLoad(avatarSrc)}
          onError={(e) => console.error('Avatar load error:', e)}
        />
      )}
      
      {/* Asset Layer (on top for corner asset or background for others) */}
      {asset && styles.assetContainer && (
        <div className={styles.assetContainer}>
          {isVideo(asset) ? (
            <video
              src={asset}
              className={styles.asset}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              style={{ pointerEvents: 'none' }}
              onLoadedData={() => handleAssetLoad(asset)}
              onError={(e) => console.error('Asset video load error:', e)}
            />
          ) : (
            <img
              src={asset}
              className={styles.asset}
              alt="Asset"
              style={{ pointerEvents: 'none' }}
              onLoad={() => handleAssetLoad(asset)}
              onError={(e) => console.error('Asset image load error:', e)}
            />
          )}
        </div>
      )}
      
      {/* Scene Type Label */}
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
        {layout.replace(/-/g, ' ')}
      </div>
    </div>
  );
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  assets, 
  avatarId, 
  className = "" 
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get avatar source
  const avatar = avatars.find(a => a.id === avatarId);
  const avatarSrc = avatar ? avatar.src : avatars[0].src;

  // Auto-advance through scenes
  useEffect(() => {
    if (!isPlaying || isHovered) return;
    
    const totalWeight = template.timeline.reduce((sum, scene) => sum + scene.durationWeight, 0);
    const currentScene = template.timeline[currentSceneIndex];
    const sceneDuration = (currentScene.durationWeight / totalWeight) * 3000; // 3 second total preview
    
    const timer = setTimeout(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % template.timeline.length);
    }, sceneDuration);
    
    return () => clearTimeout(timer);
  }, [currentSceneIndex, isPlaying, isHovered, template.timeline]);

  const currentScene = template.timeline[currentSceneIndex];
  const sceneAsset = currentScene.assetIndices && currentScene.assetIndices[0] !== undefined 
    ? assets[currentScene.assetIndices[0]] 
    : undefined;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{template.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-orange-400 hover:text-orange-300"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <span className="text-sm text-gray-400">
            {currentSceneIndex + 1}/{template.timeline.length}
          </span>
        </div>
      </div>

      {/* Main Preview */}
      <div 
        className="aspect-[9/16] w-full max-w-xs mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ScenePreview
          layout={currentScene.layout}
          asset={sceneAsset}
          avatarSrc={avatarSrc}
          isActive={isPlaying && !isHovered}
        />
      </div>

      {/* Scene Timeline */}
      <div className="flex gap-1">
        {template.timeline.map((scene, index) => (
          <div
            key={index}
            className={`h-2 rounded-full cursor-pointer transition-all duration-200 ${
              index === currentSceneIndex 
                ? 'bg-orange-500' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            style={{ 
              flex: scene.durationWeight,
              minWidth: '8px'
            }}
            onClick={() => setCurrentSceneIndex(index)}
          />
        ))}
      </div>

      {/* Scene Description */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          {currentScene.layout.replace(/-/g, ' ')}
        </p>
        {sceneAsset && (
          <p className="text-xs text-gray-500 mt-1">
            Asset {currentScene.assetIndices?.[0]! + 1}
          </p>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;