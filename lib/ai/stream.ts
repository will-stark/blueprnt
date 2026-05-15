import type { PromptPayload, StreamCallbacks } from './types'
import { streamFromGemini } from './gemini'
import { streamFromGroq } from './groq'

export async function streamFromAI(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
): Promise<void> {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasGroq = !!process.env.GROQ_API_KEY

  if (hasGemini) {
    return streamFromGemini(payload, {
      onChunk: callbacks.onChunk,
      onComplete: callbacks.onComplete,
      onError: (err) => {
        if (hasGroq) {
          console.warn('[AI] Gemini failed, falling back to Groq:', err.message)
          return streamFromGroq(payload, callbacks)
        }
        callbacks.onError(err)
      },
    })
  }

  if (hasGroq) {
    return streamFromGroq(payload, callbacks)
  }

  callbacks.onError(new Error('No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.'))
}
