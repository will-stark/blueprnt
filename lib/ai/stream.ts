import type { PromptPayload, StreamCallbacks } from './types'
import { streamFromGroq } from './groq'

export async function streamFromAI(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
): Promise<void> {
  if (!process.env.GROQ_API_KEY) {
    callbacks.onError(new Error('No AI provider configured. Set GROQ_API_KEY.'))
    return
  }
  return streamFromGroq(payload, callbacks)
}
