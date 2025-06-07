// lib/templates.ts
export type LayoutType = 
  | 'avatar-with-corner-image'
  | 'fullscreen-asset'
  | 'cutout-center-over-asset'
  | 'cutout-right-over-asset'
  | 'cutout-left-over-asset'
  | 'sequential-layering';

export interface Scene {
  duration: number; // in frames (at 30fps)
  layout: LayoutType;
  assetIndices?: number[];
  text?: {
    contentKey: 'brandName' | 'promoDetails'; // Key from AdCreationData
  };
  avatar?: {
    show: boolean;
    scriptSegment: 'fullScript'; // Use one script for the whole video
  };
}

export interface VideoTemplate {
  id: number;
  name: string;
  timeline: Scene[];
}