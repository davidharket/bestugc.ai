// lib/inngest.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "ageco-ai",
  eventKey: process.env.INNGEST_EVENT_KEY,   // same value you generated
  baseUrl:  process.env.INNGEST_BASE_URL,    // http://127.0.0.1:8288
});
