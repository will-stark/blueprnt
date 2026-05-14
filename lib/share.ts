// Share-to-unlock weekly reset helpers

// Reset happens every Monday at 1am UTC.
export function getNextResetTime(): Date {
  const now = new Date()
  const next = new Date(now)

  // Days until next Monday (0 = Sunday, 1 = Monday, ...)
  const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7
  next.setUTCDate(now.getUTCDate() + daysUntilMonday)
  next.setUTCHours(1, 0, 0, 0)

  // Edge case: if it's already past 1am Monday today, push to next week
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 7)
  }

  return next
}

export function hasClaimedThisWeek(lastClaimedAt: Date | null): boolean {
  if (!lastClaimedAt) return false

  const now = new Date()
  // Start of this week's reset window = last Monday at 1am UTC
  const lastMonday = new Date(now)
  const daysSinceMonday = (now.getUTCDay() + 6) % 7
  lastMonday.setUTCDate(now.getUTCDate() - daysSinceMonday)
  lastMonday.setUTCHours(1, 0, 0, 0)

  return lastClaimedAt >= lastMonday
}

export function formatTimeUntilReset(): string {
  const now = new Date()
  const reset = getNextResetTime()
  const diff = reset.getTime() - now.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

// Pre-filled cast text for the share flow
export const SHARE_CAST_TEXT =
  'Just discovered Blueprnt — an App that turns any app idea into a well detailed technical blueprint in seconds. Describe your idea and get architecture, tools, workflows, and development costs instantly. Try now blueprnt.app'

export function buildCastComposerUrl(): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(SHARE_CAST_TEXT)}`
}
