import type { PromptPayload, StreamCallbacks } from './types'
import { streamFromGemini } from './gemini'
import { streamFromGroq } from './groq'

export async function streamFromAI(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
): Promise<void> {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasGroq = !!process.env.GROQ_API_KEY

  if (!hasGemini && !hasGroq) {
    callbacks.onError(new Error('No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.'))
    return
  }

  if (!hasGemini) {
    return streamFromGroq(payload, callbacks)
  }

  // Run Gemini. If it fails before sending any chunks, fall back to Groq cleanly.
  // If Gemini already streamed partial content, we cannot append Groq output without
  // producing garbage — in that case forward the error to the caller instead.
  let chunksSent = 0
  let useGroqFallback = false

  await streamFromGemini(payload, {
    onChunk: (text) => {
      chunksSent++
      callbacks.onChunk(text)
    },
    onComplete: callbacks.onComplete,
    onError: (err) => {
      if (!hasGroq) {
        callbacks.onError(err)
        return
      }
      if (chunksSent > 0) {
        console.warn('[AI] Gemini failed mid-stream (%d chunks sent), cannot fall back cleanly', chunksSent)
        callbacks.onError(err)
        return
      }
      console.warn('[AI] Gemini failed (0 chunks), will fall back to Groq:', err.message)
      useGroqFallback = true
    },
  })

  if (useGroqFallback) {
    return streamFromGroq(payload, callbacks)
  }
}
