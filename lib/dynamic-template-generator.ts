// lib/dynamic-template-generator.ts
import { Scene } from './templates'; // We can reuse the Scene interface

export function generateDynamicTimeline(
  scriptDurationInSeconds: number,
  assetUrls: string[]
): Scene[] {
  const timeline: Scene[] = [];
  const fps = 30;

  // SCENE 1: Fullscreen avatar, small image in corner (4s)
  timeline.push({
    layout: 'avatar-with-corner-image',
    duration: 4 * fps,
    assetIndices: [0], // First image from assets
    avatar: { show: true, scriptSegment: 'fullScript' }, // The avatar is visible
  });

  // SCENE 2: Second asset fullscreen (2s)
  if (assetUrls.length > 1) {
    timeline.push({
      layout: 'fullscreen-asset',
      duration: 2 * fps,
      assetIndices: [1],
    });
  }

  // SCENE 3: Third asset fullscreen (2s)
  if (assetUrls.length > 2) {
    timeline.push({
      layout: 'fullscreen-asset',
      duration: 2 * fps,
      assetIndices: [2],
    });
  }
  
  // SCENE 4 & 5: Cutout avatar sequences
  // We'll combine these into a single "cutout" phase.
  // The total duration for this phase should be flexible.
  // Let's allocate the remaining script time here.
  const fixedTime = 4 + 2 + 2; // Time for scenes 1, 2, 3
  let remainingTime = Math.max(0, scriptDurationInSeconds - fixedTime);

  // SCENE 4: Cutout over 3rd asset (5s)
  if (assetUrls.length > 2) {
      const duration = Math.min(5, remainingTime);
      timeline.push({
          layout: 'cutout-center-over-asset',
          duration: duration * fps,
          assetIndices: [2],
          avatar: { show: true, scriptSegment: 'fullScript' },
      });
      remainingTime -= duration;
  }

  // SCENE 5: Cutout moves right over 4th asset (3s)
  if (assetUrls.length > 3) {
      const duration = Math.min(3, remainingTime);
      timeline.push({
          layout: 'cutout-right-over-asset',
          duration: duration * fps,
          assetIndices: [3],
          avatar: { show: true, scriptSegment: 'fullScript' },
      });
      remainingTime -= duration;
  }
  
  // SCENE 6: Sequential layering (dynamic part)
  const layerAssets = assetUrls.slice(4, 7); // Use assets 5, 6, 7
  if (layerAssets.length > 0) {
      const duration = (layerAssets.length * 2) * fps; // 1s in, 1s out per image
      timeline.push({
          layout: 'sequential-layering',
          duration: duration,
          assetIndices: [4, 5, 6], // Pass indices
      });
  }

  // SCENE 7: Final scene, cutout left
  const finalAssetIndex = Math.min(assetUrls.length - 1, 7); // Use the 8th asset, or last available
  if (assetUrls.length > 0) {
      timeline.push({
          layout: 'cutout-left-over-asset',
          duration: Math.max(3 * fps, remainingTime * fps), // Use at least 3s or remaining time
          assetIndices: [finalAssetIndex],
          avatar: { show: true, scriptSegment: 'fullScript' },
      });
  }

  return timeline;
}