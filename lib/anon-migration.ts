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

// Migration logic — called after Privy signup succeeds.
// Returns the number of credits to award (always 3 for a new Privy account).
//
// Confirmed logic (from product spec):
//   • Anonymous user gets 1 free generation (localStorage)
//   • On Privy signup: migrated chat gets edits topped up to 3
//   • User receives 3 NEW credits (balance = 3, NOT 4)
//   • Migrated chat is "free" (cost 0 credits from new balance)
//
// TODO: replace stub DB calls with real Drizzle queries.
export async function migrateAnonUser(privyId: string): Promise<{
  creditsAwarded: number
  chatMigrated: boolean
  toastMessage: string
}> {
  const anonState = loadAnonState()

  if (!anonState) {
    // No anonymous state — just award 3 credits
    // await createUser(privyId, { credits: 3 })
    return {
      creditsAwarded: 3,
      chatMigrated: false,
      toastMessage: 'Account created! 3 free blueprints added.',
    }
  }

  // 1. Create user (TODO: real DB call)
  // const user = await createUser(privyId, { credits: 3 })

  // 2. Migrate chat with edits topped up to 3 (TODO: real DB call)
  // const migratedChat = await createChat({
  //   user_id: user.id,
  //   title: anonState.title || 'New chat',
  //   edits_remaining: 3,
  //   created_at: anonState.createdAt,
  // })

  // 3. Migrate messages (TODO: real DB call)
  // for (const msg of anonState.messages) { await createMessage({ ... }) }

  clearAnonState()

  return {
    creditsAwarded: 3,
    chatMigrated: true,
    toastMessage: 'Account created! Your chat has been saved + 3 credits added.',
  }
}
