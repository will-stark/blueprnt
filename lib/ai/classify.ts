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

// Only the narrow, unambiguous factual-lookup patterns.
// Everything else is intentionally left to the AI's own system prompt rejection.
const QUESTION_PATTERNS = [
  /^who\s+(is|was|are|were)\s+/i,
  /^when\s+(was|is|did|were|will|does)\s+/i,
  /^where\s+(is|are|was|were)\s+/i,
  /^what\s+(is|are|was|were)\s+the\s+(capital|population|currency|president|prime minister|flag|gdp|timezone)/i,
]

// If any of these appear the message is about building something —
// allow through even if it matches a question pattern.
const BUILD_INTENT = [
  'build', 'creat', 'develop', 'design', 'make a', 'make an',
  'app', 'platform', 'website', 'web app', 'mobile', 'tool', 'software',
  'system', 'product', 'service', 'saas', 'marketplace', 'dashboard',
  'api', 'game', 'clone', 'startup', 'feature', 'mvp',
  // natural idea phrasing
  'idea', 'concept', 'imagine', 'want', 'i need', 'we need',
  'social', 'community', 'network', 'forum', 'feed',
  'tracker', 'generator', 'aggregator', 'scheduler', 'planner', 'organiser', 'organizer',
  'booking', 'reservation', 'listing', 'directory', 'job board',
  'chat', 'messaging', 'notification', 'alert',
  'store', 'shop', 'ecommerce', 'subscription', 'payment',
  'wallet', 'token', 'nft', 'defi', 'onchain', 'on-chain', 'blockchain', 'crypto',
  'analytics', 'monitoring', 'reporting', 'metrics',
  'like uber', 'like airbnb', 'like twitter', 'like instagram', 'like tinder',
  'but for', 'version of', 'similar to', 'alternative to',
  'integration', 'automation', 'workflow', 'pipeline',
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

  // Skip question-pattern check for edits — the user is already in a blueprint session
  const isBlocked =
    message.trim().length < MIN_LENGTH ||
    BLOCKLIST.some((w) => lower.includes(w)) ||
    (!chatId && isOffTopicQuestion(lower))

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
  if (message.length > 2000) {
    return `Your prompt is ${message.length} characters. Please reduce it to 2,000 or fewer.`
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
