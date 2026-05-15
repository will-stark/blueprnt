import type { ClassifyResult, GenerateRequestBody, Platform } from './types'

const FARCASTER_KEYWORDS = [
  'farcaster', 'warpcast', 'mini app', 'miniapp', 'frame', ' fid', 'neynar',
  'cast ', 'casts', 'channel', 'fc:', '/channel', 'wc:', 'moxie',
]

const BLOCKLIST = [
  'porn', 'nsfw', 'xxx', 'nude', 'onlyfans',
  'exploit', 'ddos', 'ransomware', 'keylogger', 'malware', 'phishing',
]

const MIN_LENGTH = 10

// Patterns that strongly indicate a factual/general-knowledge question rather
// than an app idea. Checked only when no build-intent word is present.
const QUESTION_PATTERNS = [
  /^(what is|what's|what are|what were|what was)\s+the\s+/i,
  /^(what is|what's|what are)\s+(a|an)\s+/i,
  /^who\s+(is|was|are|were)\s+/i,
  /^when\s+(was|is|did|were|will|does)\s+/i,
  /^where\s+(is|are|was|were)\s+/i,
  /^(how many|how much|how old|how far|how long|how tall|how big)\s+/i,
  /^(tell me|explain|describe)\s+(what|who|where|when|why|how)\s+/i,
  /^(give me|find me|search for)\s+(information|facts|data|the answer)/i,
  /^(name of|what.{0,20}name of)\s+the\s+/i,
  /^(do you know|can you tell me|i want to know)\s+(what|who|where|when|why|how|the)/i,
]

// If any of these appear, the message is probably about building something
// regardless of how it's phrased — allow through even if it looks like a question.
const BUILD_INTENT = [
  'build', 'creat', 'develop', 'design', 'make a', 'make an',
  'app', 'platform', 'website', 'web app', 'mobile', 'tool', 'software',
  'system', 'product', 'service', 'saas', 'marketplace', 'dashboard',
  'api', 'game', 'clone', 'startup', 'feature', 'mvp',
]

function isOffTopicQuestion(lower: string): boolean {
  const hasBuildIntent = BUILD_INTENT.some((kw) => lower.includes(kw))
  if (hasBuildIntent) return false
  return QUESTION_PATTERNS.some((p) => p.test(lower))
}

export interface ClassifyInput {
  body: GenerateRequestBody
  priorStrikeWithinWindow: boolean
}

export function classifyRequest(input: ClassifyInput): ClassifyResult {
  const { body, priorStrikeWithinWindow } = input
  const { message, chatId, isRegenerate } = body
  const lower = message.toLowerCase()

  // Regenerate re-uses the original user message — skip off-topic checks entirely
  if (isRegenerate) {
    return {
      kind: 'regenerate',
      platform: detectPlatform(lower),
      isSecondStrike: false,
    }
  }

  const isBlocked =
    message.trim().length < MIN_LENGTH ||
    BLOCKLIST.some((w) => lower.includes(w)) ||
    isOffTopicQuestion(lower)

  if (isBlocked) {
    return {
      kind: 'off_topic',
      platform: detectPlatform(lower),
      isSecondStrike: priorStrikeWithinWindow,
    }
  }

  if (chatId) {
    return {
      kind: 'edit_blueprint',
      platform: detectPlatform(lower),
      isSecondStrike: false,
    }
  }

  return {
    kind: 'new_blueprint',
    platform: detectPlatform(lower),
    isSecondStrike: false,
  }
}

function detectPlatform(lower: string): Platform {
  return FARCASTER_KEYWORDS.some((kw) => lower.includes(kw)) ? 'farcaster' : 'generic'
}

export function applyHardFilters(message: string): string | null {
  if (message.trim().length < MIN_LENGTH) {
    return 'Message too short. Please describe your app idea in more detail.'
  }
  const lower = message.toLowerCase()
  if (BLOCKLIST.some((w) => lower.includes(w))) {
    return 'Your message contains blocked content.'
  }
  if (message.length > 1000) {
    return `Your prompt is ${message.length} characters. Please reduce it to 1,000 or fewer.`
  }
  return null
}

export function applyEditFilters(message: string): string | null {
  if (message.trim().length < MIN_LENGTH) {
    return 'Message too short.'
  }
  if (message.length > 500) {
    return `Your edit instruction is ${message.length} characters. Please reduce it to 500 or fewer.`
  }
  return null
}
