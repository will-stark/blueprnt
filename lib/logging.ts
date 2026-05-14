import { createHash } from 'crypto'

/** Deterministic 12-char hex digest — safe to log, traceable for debugging. */
export function hashForLogging(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

/** Safe metadata about a user message — no plaintext exposed. */
export function getMessageMetadata(message: string) {
  return {
    hash: hashForLogging(message),
    length: message.length,
    wordCount: message.trim().split(/\s+/).length,
  }
}
