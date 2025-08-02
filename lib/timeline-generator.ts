// lib/timeline-generator.ts
import { WeightedScene } from './templates';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// --- HELPER FUNCTION MOVED FROM THE OLD FILE ---
// This function can be used in the future to ensure assets exist before rendering.
export async function validateAssets(assetUrls: string[]): Promise<string[]> {
  const checkUrl = async (url: string): Promise<boolean> => {
    if (!url) return false;

    if (url.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', url);
      return fs.existsSync(filePath);
    }
    
    if (url.startsWith('http')) {
      try {
        await axios.head(url, { timeout: 5000 });
        return true;
      } catch (error) {
        console.warn(`⚠️  Remote asset check failed for: ${url}`);
        return false;
      }
    }
    return false;
  };

  const validationResults = await Promise.all(assetUrls.map(checkUrl));
  return assetUrls.filter((_, index) => validationResults[index]);
}

// --- MAIN TIMELINE GENERATION LOGIC (UNCHANGED) ---

// This is the structure Remotion understands (with concrete frame durations).
export interface ConcreteScene {
  layout: string;
  duration: number;
  assetIndices?: number[];
}

export function generateConcreteTimeline(
  weightedTimeline: WeightedScene[],
  totalDurationInFrames: number
): ConcreteScene[] {
  const totalWeight = weightedTimeline.reduce(
    (sum, scene) => sum + scene.durationWeight,
    0
  );

  if (totalWeight === 0) {
    return [];
  }

  let accumulatedFrames = 0;
  const concreteTimeline = weightedTimeline.map((scene) => {
    const proportionalDuration = (scene.durationWeight / totalWeight) * totalDurationInFrames;
    const durationInFrames = Math.round(proportionalDuration);
    
    accumulatedFrames += durationInFrames;

    return {
      layout: scene.layout,
      duration: durationInFrames,
      assetIndices: scene.assetIndices,
    };
  });

  const roundingError = totalDurationInFrames - accumulatedFrames;
  if (roundingError !== 0 && concreteTimeline.length > 0) {
    const lastScene = concreteTimeline[concreteTimeline.length - 1];
    const adjustedDuration = lastScene.duration + roundingError;
    
    // Ensure the duration never goes negative
    if (adjustedDuration <= 0) {
      // If the adjustment would make it negative, distribute the error across all scenes
      const errorPerScene = Math.floor(roundingError / concreteTimeline.length);
      const remainingError = roundingError - (errorPerScene * concreteTimeline.length);
      
      // Apply the distributed error to each scene, ensuring no scene goes negative
      concreteTimeline.forEach((scene, index) => {
        const adjustment = errorPerScene + (index === concreteTimeline.length - 1 ? remainingError : 0);
        scene.duration = Math.max(1, scene.duration + adjustment); // Minimum 1 frame
      });
    } else {
      lastScene.duration = adjustedDuration;
    }
  }

  // Final safety check - ensure all durations are positive
  concreteTimeline.forEach((scene) => {
    if (scene.duration <= 0) {
      scene.duration = 1; // Minimum 1 frame
    }
  });

  return concreteTimeline;
}