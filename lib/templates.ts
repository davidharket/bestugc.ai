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
  | 'buildup-collage';

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

const FPS = 30; // Define frames per second for easy duration calculation.

// The official library of all available video templates, using weights.
export const TEMPLATE_LIBRARY: VideoTemplate[] = [
  {
    id: 'fast-paced-hook',
    name: 'The Quick Hook',
    description: 'Rapid cuts to grab attention instantly. Ideal for TikTok, Reels, and Shorts.',
    timeline: [
      { layout: 'fullscreen-asset', durationWeight: 2, assetIndices: [0] },
      { layout: 'cutout-left-over-asset', durationWeight: 3, assetIndices: [1] },
      { layout: 'split-screen-top-asset', durationWeight: 3, assetIndices: [0] },
      { layout: 'fullscreen-avatar', durationWeight: 2 },
    ],
  },
  {
    id: 'brand-storyteller',
    name: 'The Storyteller',
    description: 'A slightly slower pace to build a connection and tell your brand\'s story.',
    timeline: [
      { layout: 'fullscreen-avatar', durationWeight: 3 },
      { layout: 'avatar-with-corner-asset', durationWeight: 4, assetIndices: [0] },
      { layout: 'split-screen-top-asset', durationWeight: 4, assetIndices: [1] },
      { layout: 'fullscreen-avatar', durationWeight: 2 },
    ],
  },
  {
    id: 'product-is-hero',
    name: 'Product Is The Hero',
    description: 'Maximum screen time for your product images and videos. Great for demos.',
    timeline: [
      { layout: 'split-screen-top-asset', durationWeight: 4, assetIndices: [0] },
      { layout: 'fullscreen-asset', durationWeight: 3, assetIndices: [1] },
      { layout: 'cutout-right-over-asset', durationWeight: 4, assetIndices: [2] },
      { layout: 'fullscreen-avatar', durationWeight: 2 },
    ],
  },
];

// A helper function to easily find a template by its ID, now correctly EXPORTED.
export const getTemplateById = (id: string): VideoTemplate | undefined => {
  return TEMPLATE_LIBRARY.find(t => t.id === id);
};