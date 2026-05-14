export const ERROR_MESSAGES = {
  token_limit:
    'Your prompt is too long. Try shortening it or splitting into multiple messages. No credit or edit was used.',
  rate_limit:
    'The app is experiencing high demand. Please try again in a few minutes.',
  network:
    'Check your connection and try again. No credit or edit was used.',
  generation_failed:
    'Something went wrong. Please try again. No credit or edit was used.',
} as const

export type GenerationErrorKey = keyof typeof ERROR_MESSAGES

export function classifyError(err: unknown): GenerationErrorKey {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
  if (msg.includes('quota') || msg.includes('429') || msg.includes('rate')) return 'rate_limit'
  if (msg.includes('token') || msg.includes('context_length') || msg.includes('too long')) return 'token_limit'
  return 'generation_failed'
}
