export interface Scene {
  duration: number; // seconds
  layout: string;
  assetIndices?: number[];
  text?: {
    content: string;
    position?: string;
    animation?: string;
  };
  avatar?: {
    show: boolean;
    scriptSegment: string;
  };
}

export interface VideoTemplate {
  id: number;
  name: string;
  timeline: Scene[];
}

export const videoTemplates: VideoTemplate[] = [
  {
    id: 1,
    name: 'Simple Collage',
    timeline: [
      { duration: 3, layout: 'collage-4', assetIndices: [0,1,2,3], text: { content: 'Intro' } },
      { duration: 4, layout: 'avatar-right', avatar: { show: true, scriptSegment: 'intro-hook' } },
    ],
  },
  {
    id: 2,
    name: 'Avatar Focus',
    timeline: [
      { duration: 5, layout: 'avatar-right', avatar: { show: true, scriptSegment: 'intro-hook' } },
      { duration: 3, layout: 'full-image', assetIndices: [0], text: { content: 'Outro' } },
    ],
  },
];
