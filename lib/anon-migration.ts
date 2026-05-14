// Anonymous → Privy account migration scaffolding.
// Claude Code will wire this to real DB calls (Drizzle) and Privy auth hooks.

export interface AnonChatState {
  id: string
  title: string
  messages: Array<{ role: 'user' | 'assistant'; content: string; createdAt: string }>
  createdAt: string
}

const ANON_STATE_KEY = 'blueprnt-anon-state'

export function saveAnonState(chat: AnonChatState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ANON_STATE_KEY, JSON.stringify(chat))
}

export function loadAnonState(): AnonChatState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(ANON_STATE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AnonChatState
  } catch {
    return null
  }
}

export function clearAnonState() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ANON_STATE_KEY)
}

/**
 * Fire-and-forget: POST anonymous chat state to the server so it can be
 * persisted under the new Privy account, then clear local storage.
 * Called from usePrivySync when the user transitions anonymous→privy.
 */
export async function migrateAnonUser(privyId: string): Promise<void> {
  const anonState = loadAnonState()
  clearAnonState()

  fetch('/api/auth/migrate-anon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privyId, anonState }),
  }).catch(() => {})
}
