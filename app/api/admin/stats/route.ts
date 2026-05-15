import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, events } from '@/lib/db/schema'
import { count, desc, eq, inArray } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth/is-admin'
import { getDailyGenerationCount } from '@/lib/db/generation-log'

const KIND_LABEL: Record<string, string> = {
  new_blueprint: 'generation_completed',
  edit_blueprint: 'edit_completed',
  regenerate: 'edit_completed',
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
    const [requestsToday, totalUsersRows, recentEventRows, anonToggleRows] = await Promise.all([
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
    ])

    const dailyCap = parseInt(process.env.DAILY_REQUEST_CAP ?? '100', 10)
    const anonToggleRow = anonToggleRows[0]
    const anonymousEnabled = anonToggleRow
      ? !!(anonToggleRow.metadata as Record<string, unknown>)?.enabled
      : true

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

    return NextResponse.json({
      requestsToday,
      dailyCap,
      totalUsers: totalUsersRows[0]?.total ?? 0,
      anonymousEnabled,
      recentEvents,
    })
  } catch (err) {
    console.error('[ADMIN-STATS] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
