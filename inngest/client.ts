// inngest/client.ts
import { Inngest } from 'inngest';

// Explicitly read the environment variables required for Inngest
const eventKey = process.env.INNGEST_EVENT_KEY;
const apiUrl = process.env.INNGEST_API_URL;

// This logging is crucial for debugging. It will run when the Next.js server starts.
console.log(`[Inngest Client] Initializing...`);
console.log(`[Inngest Client] Found INNGEST_EVENT_KEY: ${eventKey}`);
console.log(`[Inngest Client] Found INNGEST_API_URL: ${apiUrl}`);

if (!eventKey) {
  // This will give us a very clear server-side log if the key is missing.
  console.error('[Inngest Client] CRITICAL: INNGEST_EVENT_KEY environment variable is not set!');
}

// Explicitly pass the configuration to the Inngest constructor, leaving no room for error.
export const inngest = new Inngest({
  id: 'ai-video-ad-generator',
  eventKey: eventKey,
  // If apiUrl is found in the environment, force the client to use it.
  // The Inngest SDK would normally infer this from the "inngest-dev" key,
  // but being explicit makes our setup more robust.
  ...(apiUrl && { apiUrl: apiUrl }),
});
