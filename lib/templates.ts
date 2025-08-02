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
  | 'small-cutout-bottom-left-no-padding'
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

// The official library of all available video templates, using weights.
export const TEMPLATE_LIBRARY: VideoTemplate[] = [
  {
    id: 'edge-showcase',
    name: 'Edge Showcase',
    description: 'Avatar positioned at screen edges for maximum product visibility.',
    timeline: generateAssetIndices([
      { layout: 'small-cutout-bottom-left-no-padding', durationWeight: 4 },
      { layout: 'small-cutout-bottom-right-no-padding', durationWeight: 4 },
      { layout: 'small-cutout-top-left', durationWeight: 3 },
      { layout: 'small-cutout-bottom-left-no-padding', durationWeight: 3 },
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
];

// A helper function to easily find a template by its ID, now correctly EXPORTED.
export const getTemplateById = (id: string): VideoTemplate | undefined => {
  return TEMPLATE_LIBRARY.find(t => t.id === id);
};