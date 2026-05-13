// Neynar API utilities — real calls live in server-side API routes only.
// This module is safe to import client-side (no secrets exposed).

export interface NeynarHealth {
  healthy: boolean
  message?: string
}

// Call from a server-side API route, not directly from client components.
// Example: POST /api/share/check-health → calls this and returns result.
export async function checkNeynarHealth(): Promise<NeynarHealth> {
  try {
    const response = await fetch('https://api.neynar.com/v2/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return { healthy: false, message: 'Verification service is experiencing issues.' }
    }

    return { healthy: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { healthy: false, message: 'Connection to verification service timed out.' }
    }
    return { healthy: false, message: 'Could not reach verification service.' }
  }
}

// Keywords and URL that must appear in a verified cast.
// TODO: expand keyword list before launch.
export const SHARE_REQUIRED_URL = 'blueprnt.app'
export const SHARE_REQUIRED_KEYWORDS = ['blueprnt', 'blueprint']

export function castMeetsRequirements(castText: string): boolean {
  const lower = castText.toLowerCase()
  const hasUrl = lower.includes(SHARE_REQUIRED_URL)
  const hasKeyword = SHARE_REQUIRED_KEYWORDS.some((kw) => lower.includes(kw))
  return hasUrl && hasKeyword
}
