// inngest/client.ts
import { Inngest } from 'inngest';

// Create a client to send and receive events.
// This is now the single source of truth for Inngest.
export const inngest = new Inngest({ id: 'ai-video-ad-generator' });
