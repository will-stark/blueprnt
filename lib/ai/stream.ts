import type { PromptPayload, StreamCallbacks } from './types'
import { streamFromOpenAI } from './openai'

export async function streamFromAI(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    callbacks.onError(new Error('No AI provider configured. Set OPENAI_API_KEY.'))
    return
  }
  return streamFromOpenAI(payload, callbacks)
}
