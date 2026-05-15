import type { PromptPayload, StreamCallbacks } from './types'

const MODEL = 'gpt-4o-mini'
const API_URL = 'https://api.openai.com/v1/chat/completions'

export async function streamFromOpenAI(
  payload: PromptPayload,
  callbacks: StreamCallbacks,
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    callbacks.onError(new Error('OPENAI_API_KEY not set'))
    return
  }

  const ac = new AbortController()
  const timer = setTimeout(() => {
    console.warn('[OPENAI] Timeout after 120s — aborting')
    ac.abort()
  }, 120_000)

  let res: Response
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: payload.system },
          { role: 'user', content: payload.user },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal: ac.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }
  clearTimeout(timer)

  if (!res.ok) {
    const errorText = await res.text().catch(() => '(unreadable)')
    console.error(`[OPENAI] HTTP ${res.status}:`, errorText.slice(0, 500))
    callbacks.onError(new Error(`OpenAI API error: ${res.status}`))
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
