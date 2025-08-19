/**
 * pages/api/generate-scripts.ts
 *
 * A research-backed, TTS-friendly script generator for UGC/TikTok-style ads.
 *
 * RATIONALE (selected sources):
 * - Hook must land in the first few seconds; TikTok recommends a hook/body/close structure
 *   and notes that ~90% of ad recall is captured in the first 6 seconds. 
 *   TikTok For Business, 2024–2025. 
 * - 9–15 seconds is commonly suggested for auction/TopView ads even though TikTok supports longer.
 *   Shopify (2025) quoting TikTok specs; TikTok For Business spec pages.
 * - Words per minute for natural speech sits roughly around 130–160 wpm, ~150 wpm average.
 *   National Center for Voice & Speech via VirtualSpeech; Prezent.
 * - ElevenLabs recommends writing numbers, acronyms, and symbols fully in words or normalized forms for correct pronunciation.
 *   ElevenLabs Help Center & Docs.
 * - DR/UGC high-conversion recipes consistently follow Hook → Problem → Solution → Proof → CTA.
 *   inBeat Agency; Motion (2025).
 *
 * See the answer message for in-text citations.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { AzureOpenAI } from 'openai'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { checkRateLimit, incrementRateLimit } from '../../lib/rate-limit'

/**
 * If you also run OpenAI non-Azure, you can swap to the official client.
 * This sticks to your current AzureOpenAI usage.
 */
const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
})

type ScriptType = 'cta' | 'lifestyle' | 'brand' | 'trending' | 'custom'

type ScriptSegments = {
  hook: string
  problem?: string
  solution?: string
  valueProp?: string
  proof?: string
  objectionHandle?: string
  cta: string
}

type GeneratedScript = {
  /** Fully concatenated script, plain text only, ready for TTS */
  script: string
  /** Segmented structure so you can A/B hooks, etc. */
  segments: ScriptSegments
  /** Estimated by the model (we still compute an allowed budget on our side) */
  word_count: number
  /** Model’s estimate; we also pass the target duration in the prompt */
  est_duration_seconds: number
  /** Which ad-copy archetype it primarily used (DR, PAS, AIDA, etc.) */
  archetype: 'DR' | 'PAS' | 'AIDA' | 'HPSS' | 'Custom'
}

type AIResponse = Record<ScriptType, string | GeneratedScript>

const DEFAULT_DURATION_SECONDS = 30
const DEFAULT_WPM_LOWER = 130
const DEFAULT_WPM_UPPER = 160
const DEFAULT_WPM_TARGET = 150

/**
 * Estimate a reasonable word budget from duration and speech rate.
 * We pass these numbers to the model so it can self-regulate.
 */
function estimateWordBudget(
  durationSec = DEFAULT_DURATION_SECONDS,
  wpmLower = DEFAULT_WPM_LOWER,
  wpmUpper = DEFAULT_WPM_UPPER,
  wpmTarget = DEFAULT_WPM_TARGET
) {
  const wordsPerSecondLower = wpmLower / 60
  const wordsPerSecondUpper = wpmUpper / 60
  const wordsPerSecondTarget = wpmTarget / 60

  return {
    min: Math.floor(durationSec * wordsPerSecondLower),
    max: Math.ceil(durationSec * wordsPerSecondUpper),
    target: Math.round(durationSec * wordsPerSecondTarget),
  }
}

/**
 * The language name we *explicitly* force the model to write in.
 */
function getLanguageName(languageCode?: string): string {
  const languageMap: Record<string, string> = {
    no: 'Norwegian',
    nb: 'Norwegian',
    nn: 'Norwegian',
    da: 'Danish',
    sv: 'Swedish',
    nl: 'Dutch',
    en: 'English',
  }
  return languageMap[languageCode || 'en'] || 'English'
}

/**
 * The core “recipe” we force all scripts to follow and the *hard constraints*
 * needed to make them TikTok/UGC-native and ElevenLabs-friendly.
 */
function buildRecipe(durationSec = DEFAULT_DURATION_SECONDS, language?: string) {
  const langName = getLanguageName(language)
  const budget = estimateWordBudget(durationSec)

  return `
You MUST follow this enhanced recipe & constraints for every script:

ENHANCED STRUCTURE (High-Converting UGC Format):
1) HOOK (<= 2.5 seconds, ideally <= 10–12 words):
   - Start with attention-grabbing words like "Stop scrolling if...", "Wait, what?", "You need to see this..."
   - Call out the target audience directly OR make a bold promise with specific numbers
   - Use urgency, curiosity, or controversy to stop the scroll
   
2) PROBLEM/PAIN POINT (1–2 short lines): 
   - Make it relatable and emotional - "Are you tired of...", "Struggling with...", "Fed up with..."
   - Be specific about the frustration or pain point
   
3) SOLUTION/MECHANISM (1–2 lines): 
   - Introduce the product as the solution with confidence
   - Use phrases like "That's where [product] comes in", "This changed everything for me"
   - Mention the unique mechanism or key benefit
   
4) PROOF/CREDIBILITY (1 line): 
   - Use specific numbers, time frames, or results (under 100)
   - Personal testimonial style: "In just X days", "I saved X hours", "X percent improvement"
   
5) OBJECTION HANDLING (Optional, 1 line):
   - Address common concerns: "I was skeptical too, but...", "It's easier than you think"
   
6) CTA (1 line): 
   - MUST end with directing users to visit the website
   - Use urgent, actionable language: "Check out our website now", "Visit our site today", "Get started on our website"

ADVANCED TTS OPTIMIZATION (for ElevenLabs):
- Entire script in ${langName} with natural, conversational flow
- Plain text only. No markdown, emojis, symbols like ™ or ®
- Use contractions naturally: "I'm", "you're", "it's", "won't" for conversational tone
- Write numbers as words: "twenty-five" not "25", "three" not "3"
- Model numbers with dashes: "X-2-1-8", "G-P-S-5-0-0-0"
- NEVER use numbers above 100 in any context
- NEVER mention specific prices or currency amounts
- Discounts in percentage only: "forty percent off", "fifty percent discount"
- Use natural pauses with commas and periods for better TTS flow
- Sentences <= 18 words for optimal prosody and comprehension

ENGAGEMENT & RETENTION OPTIMIZATION:
- Script duration: approximately ${durationSec} seconds
- Target word count: ~${budget.target} words (range ${budget.min}–${budget.max})
- First 3 seconds are CRITICAL - must grab attention immediately
- Use "you" frequently to create personal connection
- Speak as a real person sharing a discovery, not as a salesperson
- Include emotion words: "amazing", "incredible", "shocked", "obsessed"
- Create urgency without being pushy

SCRIPT VARIETY BY TYPE:
- CTA: Direct, benefit-focused, solution-oriented
- LIFESTYLE: Aspirational, emotional, transformation-focused  
- BRAND: Story-driven, value-focused, trust-building
- TRENDING: Current, relatable, social proof heavy
- CUSTOM: Unique angle, creative approach, memorable hook

RETURN FORMAT:
Return a JSON object *only* through the provided function call where each script type has:
{
  "script": "<full plain text script optimized for TTS and engagement>",
  "segments": {
    "hook": "...",
    "problem": "...", 
    "solution": "...",
    "valueProp": "...",
    "proof": "...",
    "objectionHandle": "...",
    "cta": "..."
  },
  "word_count": <int>,
  "est_duration_seconds": <int>,
  "archetype": "DR" | "PAS" | "AIDA" | "HPSS" | "Custom"
}

DO NOT return anything outside that JSON function call.
`.trim()
}

/**
 * Build a JSON schema for the function call so the model is *forced*
 * to give us structured output that we can program against.
 */
function buildFunctionSchema(scriptTypes: ScriptType[]) {
  const segmentsSchema = {
    type: 'object',
    properties: {
      hook: { type: 'string' },
      problem: { type: 'string' },
      solution: { type: 'string' },
      valueProp: { type: 'string' },
      proof: { type: 'string' },
      objectionHandle: { type: 'string' },
      cta: { type: 'string' },
    },
    required: ['hook', 'cta'],
  }

  const generatedScriptSchema = {
    type: 'object',
    properties: {
      script: { type: 'string' },
      segments: segmentsSchema,
      word_count: { type: 'integer' },
      est_duration_seconds: { type: 'integer' },
      archetype: {
        type: 'string',
        enum: ['DR', 'PAS', 'AIDA', 'HPSS', 'Custom'],
      },
    },
    required: ['script', 'segments', 'word_count', 'est_duration_seconds', 'archetype'],
  }

  const scriptProperties: Record<string, any> = {}
  for (const type of scriptTypes) {
    scriptProperties[type] = generatedScriptSchema
  }

  return {
    name: 'generate_scripts',
    description: 'Generate video ad scripts for each requested type as structured JSON.',
    parameters: {
      type: 'object',
      properties: scriptProperties,
      required: scriptTypes,
    },
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Extract request body
  const {
    promptTypes,
    summary,
    productName,
    brandName,
    promoDetails,
    language,
    duration,
    regenerate,
    isAiGenerated,
  } = req.body

  const scriptTypes: ScriptType[] =
    Array.isArray(promptTypes) && promptTypes.length > 0
      ? promptTypes
      : ['cta', 'lifestyle', 'brand', 'trending', 'custom']

  if (!summary) {
    return res.status(400).json({ error: 'Missing summary' })
  }

  // Prevent API cost abuse on user-provided text
  if (!isAiGenerated && summary.length > 1000) {
    return res.status(400).json({ error: 'Summary must be 1000 characters or less' })
  }
  if (productName && productName.length > 100) {
    return res.status(400).json({ error: 'Product name must be 100 characters or less' })
  }
  if (brandName && brandName.length > 100) {
    return res.status(400).json({ error: 'Brand name must be 100 characters or less' })
  }
  if (promoDetails && promoDetails.length > 200) {
    return res.status(400).json({ error: 'Promotion details must be 200 characters or less' })
  }

  // Rate limit *before* spending tokens
  const rateLimitCheck = await checkRateLimit(session.user.id, 'script_generation')
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You can only generate ${rateLimitCheck.current} scripts per hour. Please try again at ${rateLimitCheck.resetTime.toISOString()}.`,
      rateLimitInfo: {
        current: rateLimitCheck.current,
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime,
      },
    })
  }

  // Compose inputs for the model
  const targetDuration = typeof duration === 'number' && duration > 0 ? duration : DEFAULT_DURATION_SECONDS
  const targetLanguage = getLanguageName(language || 'en')

  let userPrompt = `Product: ${productName || brandName || ''}\nSummary: ${summary}`
  if (promoDetails) userPrompt += `\nPromotion: ${promoDetails}`

  userPrompt += `

IMPORTANT:
- Write ALL scripts in ${targetLanguage}.
- Follow the provided recipe strictly (hook first, ≤ 2.5s; short sentences; DR structure).
- Plain text only, no markdown, no emojis, no ™ or ®.
- Separate every character of model numbers / codes by dashes (X-2-1-8, G-P-S-5-0-0-0).
- CRITICAL: NEVER use numbers above 100 in any context (discount, quantity, time, etc.).
- CRITICAL: NEVER mention specific prices, costs, or currency amounts.
- CRITICAL: ONLY mention discounts in percentage format (e.g., "40 percent discount", "50 percent off").
- Fit approximately ${targetDuration} seconds (aim for ~${estimateWordBudget(targetDuration).target} words).
- Talk like a *real user*, not a TV advertiser.
- EVERY script MUST end with a call-to-action directing users to visit the website (e.g., "visit our website", "check out our site", "learn more at our website").
`

  const functionSchema = buildFunctionSchema(scriptTypes)
  const systemPrompt = buildRecipe(targetDuration, language)

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      temperature: 0.7, // slightly reduced for more deterministic adherence to the recipe
      max_tokens: 2200,
      function_call: { name: functionSchema.name },
      functions: [functionSchema],
      messages: [
        {
          role: 'system',
          content: `You are a world-class UGC content creator and copywriter specializing in viral TikTok, Instagram Reels, and YouTube Shorts advertisements. You have generated thousands of high-converting video scripts that consistently achieve 3%+ click-through rates and drive significant revenue. Your scripts are optimized for both human engagement and ElevenLabs TTS pronunciation. You understand platform psychology, attention retention techniques, and what makes viewers stop scrolling and take action. ${systemPrompt}`,
        },
        {
          role: 'user',
          content: [
            `Script types to generate: ${scriptTypes.join(', ')}`,
            userPrompt,
            `Remember: Write ALL scripts in ${targetLanguage}.`,
          ].join('\n'),
        },
      ],
    })

    const functionCall = completion.choices[0]?.message?.function_call
    if (!functionCall || !functionCall.arguments) {
      return res.status(500).json({ error: 'No function call response from AI.' })
    }

    let parsed: AIResponse
    try {
      parsed = JSON.parse(functionCall.arguments)
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI function call arguments.' })
    }

    // Backwards-compatible flattening + also return structured result
    const flatScripts: Record<string, string> = {}
    const structured: Record<string, GeneratedScript | null> = {}

    for (const type of scriptTypes) {
      const value = (parsed as any)[type]
      if (typeof value === 'string') {
        flatScripts[type] = value
        structured[type] = null
      } else if (value && typeof value.script === 'string') {
        flatScripts[type] = value.script
        structured[type] = value as GeneratedScript
      } else {
        return res.status(500).json({ error: `AI did not return a valid script for type: ${type}` })
      }
    }

    // Increment rate limit only after successful generation
    await incrementRateLimit(session.user.id, 'script_generation')

    return res.status(200).json({
      scripts: flatScripts, // keep old consumers working
      structured, // richer data for new consumers (segmentable, measurable)
      meta: {
        recipe_version: '2025-07-24',
        duration_seconds: targetDuration,
        language: targetLanguage,
        word_budget: estimateWordBudget(targetDuration),
        regenerate: !!regenerate,
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate scripts', details: error.message })
  }
}
