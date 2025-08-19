// remotion/types.ts
import { z } from 'zod';

// This is the single source of truth for the composition props schema.
// Both Main.tsx and Main4x5.tsx will import this.
export const CompositionProps = z.object({
  adData: z.any(),
  timeline: z.array(z.any()),
  audioUrl: z.string(),
  processedAvatarUrl: z.string(),
  greenscreenAvatarUrl: z.string(),
  baseUrl: z.string(),
});
