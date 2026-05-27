import type { PromptPayload, StreamCallbacks } from './types'

const PRIMARY_MODEL = 'llama-3.3-70b-versatile'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function streamFromGroq(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
  modelOverride?: string,
): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    callbacks.onError(new Error('GROQ_API_KEY not set'))
    return
  }

  const model = modelOverride ?? PRIMARY_MODEL

  const ac = new AbortController()
  const timer = setTimeout(() => {
    console.warn(`[GROQ] Timeout after 90s — aborting model ${model}`)
    ac.abort()
  }, 90_000)

  let res: Response
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: payload.system },
          { role: 'user', content: payload.user },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 16000,
      }),
      signal: ac.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (model !== FALLBACK_MODEL) {
      console.warn(`[GROQ] Fetch error for ${model} — trying fallback`)
      return streamFromGroq(payload, callbacks, FALLBACK_MODEL)
    }
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }
  clearTimeout(timer)

  if (!res.ok) {
    const errorText = await res.text().catch(() => '(unreadable)')
    console.error(`[GROQ] HTTP ${res.status} from model ${model}:`, errorText.slice(0, 500))
    if (model !== FALLBACK_MODEL) {
      return streamFromGroq(payload, callbacks, FALLBACK_MODEL)
    }
    callbacks.onError(new Error(`Groq API error: ${res.status}`))
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
          const chunk: string = parsed?.choices?.[0]?.delta?.content ?? ''
          if (chunk) {
            fullText += chunk
            callbacks.onChunk(chunk)
          }
        } catch {
          // malformed SSE line — skip
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
