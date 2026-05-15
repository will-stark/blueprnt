import type { PromptPayload } from './types'

const PRIMARY_MODEL = 'gemini-2.5-flash-preview-05-20'
const FALLBACK_MODEL = 'gemini-2.0-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface StreamCallbacks {
  onChunk: (text: string) => void
  onComplete: (fullText: string) => Promise<void> | void
  onError: (err: Error) => void
}

export async function streamFromGemini(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
  modelOverride?: string,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const model = modelOverride ?? PRIMARY_MODEL
  const url = `${API_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`

  const body = {
    system_instruction: { parts: [{ text: payload.system }] },
    contents: [{ role: 'user', parts: [{ text: payload.user }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
    },
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    // Network failure — try fallback if we haven't already
    if (model !== FALLBACK_MODEL) {
      return streamFromGemini(payload, callbacks, FALLBACK_MODEL)
    }
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!res.ok) {
    if (model !== FALLBACK_MODEL) {
      return streamFromGemini(payload, callbacks, FALLBACK_MODEL)
    }
    callbacks.onError(new Error(`Gemini API error: ${res.status}`))
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError(new Error('No response body'))
    return
  }

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6).trim()
        if (json === '[DONE]') continue

        try {
          const parsed = JSON.parse(json)
          const chunk: string =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
          if (chunk) {
            fullText += chunk
            callbacks.onChunk(chunk)
          }
        } catch {
          // Malformed SSE line — skip
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  } finally {
    reader.releaseLock()
  }

  await callbacks.onComplete(fullText)
}
