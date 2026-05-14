import { db } from './index'
import { events } from './schema'
import { and, eq, gte, sql } from 'drizzle-orm'

const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Check whether this browser fingerprint has already generated a blueprint
 * in the last 24 hours. Returns true if the limit is hit.
 *
 * Call this from /api/generate before running Gemini for anonymous users.
 */
export async function isAnonymousLimitHit(anonymousId: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS)

  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.eventType, 'anonymous_generation'),
        sql`metadata->>'anonymousId' = ${anonymousId}`,
        gte(events.createdAt, since)
      )
    )
    .limit(1)

  return !!row
}

/**
 * Log a successful anonymous generation event.
 * Call this from /api/generate after a successful Gemini response.
 */
export async function logAnonymousGeneration(anonymousId: string): Promise<void> {
  await db.insert(events).values({
    txHash:      `anon-${anonymousId}-${Date.now()}`, // placeholder — not a real tx
    fromAddress: 'anonymous',
    toAddress:   'anonymous',
    amountUsdc:  '0',
    blockNumber: 0,
    eventType:   'anonymous_generation',
    metadata:    { anonymousId, timestamp: new Date().toISOString() },
  })
}
