import type { ClassifyResult, GenerateRequestBody, Platform } from './types'

// Farcaster keyword detection — no AI needed
const FARCASTER_KEYWORDS = [
  'farcaster', 'warpcast', 'mini app', 'miniapp', 'frame', ' fid', 'neynar',
  'cast ', 'casts', 'channel', 'fc:', '/channel', 'wc:', 'moxie',
]

const BLOCKLIST = [
  'porn', 'nsfw', 'xxx', 'nude', 'onlyfans',
  'exploit', 'ddos', 'ransomware', 'keylogger', 'malware', 'phishing',
]

const MIN_LENGTH = 10

export interface ClassifyInput {
  body: GenerateRequestBody
  priorStrikeWithinWindow: boolean // caller checks events table
}

export function classifyRequest(input: ClassifyInput): ClassifyResult {
  const { body, priorStrikeWithinWindow } = input
  const { message, chatId, isRegenerate } = body
  const lower = message.toLowerCase()

  // Hard off-topic: too short or blocklisted
  const isBlocked =
    message.trim().length < MIN_LENGTH ||
    BLOCKLIST.some((w) => lower.includes(w))

  if (isBlocked) {
    return {
      kind: 'off_topic',
      platform: detectPlatform(lower),
      isSecondStrike: priorStrikeWithinWindow,
    }
  }

  // Regenerate flag takes priority over chatId logic
  if (isRegenerate) {
    return {
      kind: 'regenerate',
      platform: detectPlatform(lower),
      isSecondStrike: false,
    }
  }

  // chatId present = working inside an existing chat = edit
  if (chatId) {
    return {
      kind: 'edit_blueprint',
      platform: detectPlatform(lower),
      isSecondStrike: false,
    }
  }

  // No chatId = first message = new blueprint
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
