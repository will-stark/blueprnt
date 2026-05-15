import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, events, tickets } from '@/lib/db/schema'
import { and, count, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth/is-admin'
import { getDailyGenerationCount } from '@/lib/db/generation-log'

const KIND_LABEL: Record<string, string> = {
  new_blueprint: 'generation_completed',
  edit_blueprint: 'edit_completed',
  regenerate: 'edit_completed',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfTodayUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const identityType = searchParams.get('identityType')
  const identityId = searchParams.get('identityId')
  const email = searchParams.get('email')

  if (!isAdmin(identityType, identityId, email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const todayUtc = startOfTodayUtc()
    const sevenDaysAgo = new Date(todayUtc.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      requestsToday,
      totalUsersRows,
      recentEventRows,
      anonToggleRows,
      newUsersRows,
      activeUsersTodayRows,
      ticketStatsRows,
      platformSplitRows,
      last7DaysRows,
    ] = await Promise.all([
      getDailyGenerationCount(),
      db.select({ total: count() }).from(users),
      db
        .select()
        .from(events)
        .where(inArray(events.eventType, ['generation', 'off_topic_strike', 'ticket_submitted']))
        .orderBy(desc(events.createdAt))
        .limit(10),
      db
        .select()
        .from(events)
        .where(eq(events.eventType, 'admin_toggle_anon'))
        .orderBy(desc(events.createdAt))
        .limit(1),
      db.select({ total: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      db
        .select({ total: sql<number>`COUNT(DISTINCT (metadata->>'identityId'))::int` })
        .from(events)
        .where(and(eq(events.eventType, 'generation'), gte(events.createdAt, todayUtc))),
      db
        .select({ status: tickets.status, total: count() })
        .from(tickets)
        .groupBy(tickets.status),
      db
        .select({ identityType: users.identityType, total: count() })
        .from(users)
        .groupBy(users.identityType),
      db
        .select({
          day: sql<string>`DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')::text`,
          total: count(),
        })
        .from(events)
        .where(and(eq(events.eventType, 'generation'), gte(events.createdAt, sevenDaysAgo)))
        .groupBy(sql`DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')`)
        .orderBy(sql`DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')`),
    ])

    // ── daily cap ────────────────────────────────────────────────────────────
    const dailyCap = parseInt(process.env.DAILY_REQUEST_CAP ?? '100', 10)

    // ── anon toggle ──────────────────────────────────────────────────────────
    const anonToggleRow = anonToggleRows[0]
    const anonymousEnabled = anonToggleRow
      ? !!(anonToggleRow.metadata as Record<string, unknown>)?.enabled
      : true

    // ── recent events with usernames ─────────────────────────────────────────
    const identityIds = recentEventRows
      .map((e) => (e.metadata as Record<string, string> | null)?.identityId)
      .filter((id): id is string => Boolean(id))
    const usernameMap = new Map<string, string>()
    if (identityIds.length > 0) {
      const userRows = await db
        .select({ identityId: users.identityId, username: users.username, email: users.email })
        .from(users)
        .where(inArray(users.identityId, identityIds))
      for (const u of userRows) {
        usernameMap.set(u.identityId, u.username ?? u.email ?? u.identityId)
      }
    }
    const recentEvents = recentEventRows.map((e) => {
      const meta = (e.metadata as Record<string, string> | null) ?? {}
      const eid = meta.identityId ?? ''
      const rawType = e.eventType ?? 'unknown'
      const displayType = meta.kind ? (KIND_LABEL[meta.kind] ?? rawType) : rawType
      return {
        type: displayType,
        identityId: eid,
        username: usernameMap.get(eid) ?? eid,
        timestamp: e.createdAt?.toISOString() ?? new Date().toISOString(),
      }
    })

    // ── ticket stats ─────────────────────────────────────────────────────────
    const ticketStats = { open: 0, in_progress: 0, resolved: 0, total: 0 }
    for (const row of ticketStatsRows) {
      const s = row.status ?? ''
      ticketStats.total += row.total
      if (s === 'open') ticketStats.open = row.total
      else if (s === 'in_progress') ticketStats.in_progress = row.total
      else if (s === 'resolved') ticketStats.resolved = row.total
    }

    // ── platform split ───────────────────────────────────────────────────────
    const platformSplit = { farcaster: 0, privy: 0 }
    for (const row of platformSplitRows) {
      if (row.identityType === 'farcaster') platformSplit.farcaster = row.total
      else if (row.identityType === 'privy') platformSplit.privy = row.total
    }

    // ── last 7 days activity (fill missing days with 0) ──────────────────────
    const activityByDate = new Map(last7DaysRows.map((r) => [r.day.slice(0, 10), r.total]))
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayUtc.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      return { day: DAYS[d.getUTCDay()], count: activityByDate.get(key) ?? 0 }
    })

    return NextResponse.json({
      requestsToday,
      dailyCap,
      totalUsers: totalUsersRows[0]?.total ?? 0,
      newUsersThisWeek: newUsersRows[0]?.total ?? 0,
      activeUsersToday: Number(activeUsersTodayRows[0]?.total ?? 0),
      anonymousEnabled,
      recentEvents,
      ticketStats,
      platformSplit,
      last7Days,
    })
  } catch (err) {
    console.error('[ADMIN-STATS] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
