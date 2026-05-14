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
