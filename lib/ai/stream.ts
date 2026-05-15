import type { PromptPayload, StreamCallbacks } from './types'
// import { streamFromGemini } from './gemini'   // disabled — switch back when billing is active
import { streamFromGroq } from './groq'

export async function streamFromAI(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
): Promise<void> {
  const hasGroq = !!process.env.GROQ_API_KEY

  if (!hasGroq) {
    callbacks.onError(new Error('No AI provider configured. Set GROQ_API_KEY.'))
    return
  }

  return streamFromGroq(payload, callbacks)
}
