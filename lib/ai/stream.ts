import type { PromptPayload, StreamCallbacks } from './types'
import { streamFromOpenAI, generateFromOpenAI } from './openai'

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

// Silent non-streaming retry — buffers full response, throws on API failure
export async function generateFromAI(payload: PromptPayload): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('No AI provider configured. Set OPENAI_API_KEY.')
  return generateFromOpenAI(payload)
}
