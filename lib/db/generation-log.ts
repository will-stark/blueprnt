import { db } from './index'
import { events } from './schema'
import { and, eq, gte, sql, count } from 'drizzle-orm'

const RATE_LIMIT_WINDOW_MS = 30 * 1000       // 30 seconds per user
const STRIKE_WINDOW_MS    = 10 * 60 * 1000   // 10 minutes for two-strike off-topic

// ---------------------------------------------------------------------------
// Daily global cap
// ---------------------------------------------------------------------------

export async function getDailyGenerationCount(): Promise<number> {
  const since = startOfTodayUtc()
  const [row] = await db
    .select({ total: count() })
    .from(events)
    .where(and(eq(events.eventType, 'generation'), gte(events.createdAt, since)))
  return row?.total ?? 0
}

// ---------------------------------------------------------------------------
// Per-user rate limiting (30s window)
// ---------------------------------------------------------------------------

export async function isUserRateLimited(identityId: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.eventType, 'generation'),
        sql`metadata->>'identityId' = ${identityId}`,
        gte(events.createdAt, since),
      ),
    )
    .limit(1)
  return !!row
}

// ---------------------------------------------------------------------------
// Two-strike off-topic tracking (10-minute window)
// ---------------------------------------------------------------------------

export async function hasPriorStrikeInWindow(identityId: string): Promise<boolean> {
  const since = new Date(Date.now() - STRIKE_WINDOW_MS)
  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.eventType, 'off_topic_strike'),
        sql`metadata->>'identityId' = ${identityId}`,
        gte(events.createdAt, since),
      ),
    )
    .limit(1)
  return !!row
}

export async function logOffTopicStrike(identityId: string): Promise<void> {
  await db.insert(events).values({
    txHash:      `strike-${identityId}-${Date.now()}`,
    fromAddress: identityId,
    toAddress:   'system',
    amountUsdc:  '0',
    blockNumber: 0,
    eventType:   'off_topic_strike',
    metadata:    { identityId, timestamp: new Date().toISOString() },
  })
}

// ---------------------------------------------------------------------------
// Log a successful generation
// ---------------------------------------------------------------------------

export async function logGeneration(identityId: string, kind: string): Promise<void> {
  await db.insert(events).values({
    txHash:      `gen-${identityId}-${Date.now()}`,
    fromAddress: identityId,
    toAddress:   'system',
    amountUsdc:  '0',
    blockNumber: 0,
    eventType:   'generation',
    metadata:    { identityId, kind, timestamp: new Date().toISOString() },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfTodayUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}
