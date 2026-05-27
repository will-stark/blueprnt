/**
 * Returns true if there is any evidence this browser has used the app before.
 * Used to suppress first-time onboarding for returning users.
 */
export function isReturningUser(): boolean {
  if (typeof window === 'undefined') return false

  const keys = Object.keys(localStorage)

  const hasOnboarding = keys.some((k) => k.startsWith('blueprnt-') && k.endsWith('-onboarding-seen'))
  const hasAnonState = localStorage.getItem('blueprnt-anon-state') !== null

  return hasOnboarding || hasAnonState
}

const SESSION_CHAT_KEY = 'blueprnt-session-chat'

/** Returns the chat ID the user was last active in during this tab session, or null if none. */
export function getSessionChat(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SESSION_CHAT_KEY)
}

/** Records the active chat ID into session storage so a same-tab refresh restores it. */
export function setSessionChat(chatId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_CHAT_KEY, chatId)
}
