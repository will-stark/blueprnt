import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, chats, events } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth/is-admin'

// Module-level cache so the /api/state poll (every 10s) doesn't hammer the DB
let anonAllowedCache: { value: boolean; at: number } | null = null
const ANON_CACHE_TTL = 60_000

async function getAnonymousAllowed(): Promise<boolean> {
  if (anonAllowedCache && Date.now() - anonAllowedCache.at < ANON_CACHE_TTL) {
    return anonAllowedCache.value
  }
  try {
    const [row] = await db
      .select()
      .from(events)
      .where(eq(events.eventType, 'admin_toggle_anon'))
      .orderBy(desc(events.createdAt))
      .limit(1)
    const value = row ? !!(row.metadata as Record<string, unknown>)?.enabled : true
    anonAllowedCache = { value, at: Date.now() }
    return value
  } catch {
    return true
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const identityId   = searchParams.get('identityId')
  const identityType = searchParams.get('identityType') as 'farcaster' | 'privy' | null
  const chatId       = searchParams.get('chatId')

  console.log('[STATE] GET hit: identityType=%s hasIdentityId=%s hasChatId=%s',
    identityType, !!identityId, !!chatId)

  try {
    const anonymousAllowed = await getAnonymousAllowed()

    if (!identityId || !identityType) {
      console.log('[STATE] Anonymous request — returning defaults')
      return NextResponse.json({
        userType: 'anonymous',
        anonymousAllowed,
        creditsRemaining: null,
        editsRemaining: null,
      })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.identityId, identityId))
      .limit(1)

    if (!user) {
      console.warn('[STATE] User not found: identityId=%s', identityId.slice(0, 10) + '…')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check/award gifted cycle if one just expired
    const now = new Date()
    let giftedCycleExpiresAt = user.giftedCycleExpiresAt
    if (giftedCycleExpiresAt && giftedCycleExpiresAt <= now) {
      // Cycle expired — clear it
      await db.update(users).set({ giftedCycleExpiresAt: null }).where(eq(users.id, user.id))
      giftedCycleExpiresAt = null
    }

    // Fetch editsRemaining for the active chat if chatId provided
    let editsRemaining: number | null = null
    if (chatId) {
      const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
      if (chat && chat.userId === user.id) {
        editsRemaining = chat.editsRemaining

        // If edits are 0 and there's an active gifted cycle, grant a batch
        if (editsRemaining === 0 && giftedCycleExpiresAt && giftedCycleExpiresAt > now) {
          await db.update(chats).set({ editsRemaining: 3 }).where(eq(chats.id, chatId))
          editsRemaining = 5
        }
      }
    }

    // Check env-var admin config on every poll — takes effect without re-login
    const adminFromEnv = isAdmin(identityType, identityId, user.email ?? undefined)
    const isAdminUser = user.isAdmin || adminFromEnv
    if (!user.isAdmin && adminFromEnv) {
      // Sync DB so sidebar shows without waiting for next upsert
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, user.id))
    }

    console.log('[STATE] OK: credits=%d edits=%s isAdmin=%s (env=%s)', user.creditsRemaining, editsRemaining ?? 'n/a', isAdminUser, adminFromEnv)
    return NextResponse.json({
      userType: identityType,
      anonymousAllowed,
      creditsRemaining: user.creditsRemaining,
      editsRemaining,
      giftedCycleExpiresAt,
      creditCycleExpiresAt: user.creditCycleExpiresAt,
      isAdmin: isAdminUser,
    })
  } catch (err) {
    console.error('[STATE] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
