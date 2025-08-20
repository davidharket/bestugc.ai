// lib/templates.ts

// The 6 fundamental "shot" types that are the building blocks of any video.
export type LayoutType =
  | 'fullscreen-avatar'
  | 'fullscreen-asset'
  | 'cutout-left-over-asset'
  | 'cutout-right-over-asset'
  | 'avatar-with-corner-asset'
  | 'split-screen-top-asset'
  | 'cutout-center-over-asset'
  | 'buildup-collage'
  | 'small-cutout-bottom-left'
  | 'small-cutout-bottom-right'
  | 'small-cutout-center'
  | 'small-cutout-bottom-right-no-padding'
  | 'small-cutout-center-tilted-left'
  | 'small-cutout-center-tilted-right'
  | 'small-cutout-top-left'
  | 'small-cutout-top-right';

// The interface is defined once and EXPORTED.
export interface WeightedScene {
  layout: LayoutType;
  durationWeight: number; // e.g., 1, 2, 3...
  assetIndices?: number[];
}

// The structure for a complete, named video template.
export interface VideoTemplate {
  id: string; // A unique identifier for the template.
  name: string; // The user-facing name.
  description: string; // A description to help the user choose.
  timeline: WeightedScene[];
}

const FPS = 24; // Match SyncLabs video frame rate for accurate timeline calculation

// Helper function to generate unique asset indices for a template
function generateAssetIndices(timeline: Omit<WeightedScene, 'assetIndices'>[]): WeightedScene[] {
  let assetCounter = 0;
  return timeline.map(scene => ({
    ...scene,
    assetIndices: [assetCounter++]
  }));
}

// Helper function to scale template timeline based on duration - matches ageco.ai logic
export const scaleTemplateForDuration = (template: VideoTemplate, duration: number): VideoTemplate => {
  const baseDuration = 30; // Base template is designed for 30 seconds
  const baseScenes = template.timeline;
  
  if (duration === baseDuration) {
    // No scaling needed for 30 second duration
    return template;
  }
  
  if (duration === 15) {
    // For 15 seconds: Use first 2 scenes only
    const scaledTimeline = baseScenes.slice(0, 2);
    return {
      ...template,
      timeline: scaledTimeline,
      description: template.description + ' (15s version)'
    };
  }
  
  if (duration === 60) {
    // For 60 seconds: Repeat the 4-scene pattern twice (8 scenes total)
    const scaledTimeline = [
      ...baseScenes, // First loop (scenes 1-4)
      ...baseScenes  // Second loop (scenes 5-8, using assets 4-7)
    ];
    
    // Update asset indices for the second loop to use assets 4-7
    // This requires users to have 8 assets to choose 60-second videos
    const finalTimeline = scaledTimeline.map((scene, index) => {
      if (index >= baseScenes.length) {
        // Second loop - offset asset indices to use assets 4-7
        const originalAssetIndex = scene.assetIndices?.[0] || 0;
        const offsetAssetIndex = originalAssetIndex + baseScenes.length; // 0→4, 1→5, 2→6, 3→7
        return {
          ...scene,
          assetIndices: [offsetAssetIndex]
        };
      }
      return scene;
    });
    
    return {
      ...template,
      timeline: finalTimeline,
      description: template.description + ' (60s version)'
    };
  }
  
  // Fallback to original template
  return template;
};

// Legacy function for backwards compatibility
export function adjustTimelineForDuration(template: VideoTemplate, duration: number): VideoTemplate {
  return scaleTemplateForDuration(template, duration);
}

// The official library of all available video templates, using weights.
export const TEMPLATE_LIBRARY: VideoTemplate[] = [
  {
    id: 'edge-showcase',
    name: 'Edge Showcase',
    description: 'Avatar positioned at screen edges for maximum product visibility.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-bottom-right-no-padding', durationWeight: 4 },
      { layout: 'small-cutout-top-left', durationWeight: 3 },
      { layout: 'small-cutout-top-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 3 },
    ]),
  },
  {
    id: 'dynamic-tilted',
    name: 'Dynamic & Tilted',
    description: 'Energetic tilted avatars creating visual interest and movement.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-center-tilted-left', durationWeight: 4 },
      { layout: 'small-cutout-center-tilted-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 3 },
      { layout: 'small-cutout-center-tilted-left', durationWeight: 3 },
    ]),
  },
  {
    id: 'corner-complete',
    name: 'Corner Complete',
    description: 'Full corner coverage with top and bottom positioning.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-top-left', durationWeight: 3 },
      { layout: 'small-cutout-bottom-right', durationWeight: 4 },
      { layout: 'small-cutout-top-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 3 },
    ]),
  },
  {
    id: 'mixed-positions',
    name: 'Mixed Positions',
    description: 'Varied avatar positions combining padding and no-padding styles.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-center-tilted-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-right-no-padding', durationWeight: 3 },
      { layout: 'small-cutout-top-left', durationWeight: 4 },
      { layout: 'small-cutout-center-tilted-left', durationWeight: 3 },
    ]),
  },
  {
    id: 'classic-presenter',
    name: 'Classic Presenter',
    description: 'Traditional bottom positioning with balanced padding.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-bottom-left', durationWeight: 4 },
      { layout: 'small-cutout-center', durationWeight: 4 },
      { layout: 'small-cutout-bottom-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 3 },
    ]),
  },
  {
    id: 'bottom-left',
    name: 'Bottom Left Avatar',
    description: 'Avatar stays in the bottom-left corner throughout the entire video.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-bottom-left', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 4 },
      { layout: 'small-cutout-bottom-left', durationWeight: 3 },
    ]),
  },
  {
    id: 'bottom-right',
    name: 'Bottom Right Avatar',
    description: 'Avatar stays in the bottom-right corner throughout the entire video.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-bottom-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-right', durationWeight: 4 },
      { layout: 'small-cutout-bottom-right', durationWeight: 3 },
    ]),
  },
];

// A helper function to easily find a template by its ID, now correctly EXPORTED.
export const getTemplateById = (id: string): VideoTemplate | undefined => {
  return TEMPLATE_LIBRARY.find(t => t.id === id);
};