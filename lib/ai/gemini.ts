import type { PromptPayload } from './types'

const PRIMARY_MODEL = 'gemini-1.5-flash'
const FALLBACK_MODEL = 'gemini-1.5-flash-8b'
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
      maxOutputTokens: 8192,
    },
  }

  const ac = new AbortController()
  const timer = setTimeout(() => {
    console.warn(`[GEMINI] Timeout after 50s — aborting model ${model}`)
    ac.abort()
  }, 50_000)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    // Network failure or timeout — try fallback if we haven't already
    if (model !== FALLBACK_MODEL) {
      console.warn(`[GEMINI] Fetch error for ${model} — trying fallback`)
      return streamFromGemini(payload, callbacks, FALLBACK_MODEL)
    }
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }
  clearTimeout(timer)

  if (!res.ok) {
    const errorText = await res.text().catch(() => '(unreadable)')
    console.error(`[GEMINI] HTTP ${res.status} from model ${model}:`, errorText.slice(0, 500))
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
