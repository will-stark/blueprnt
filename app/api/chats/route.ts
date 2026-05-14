import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, chats } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/chats?identityId=X&userType=farcaster|privy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const identityId = searchParams.get('identityId')
  const userType = searchParams.get('userType')

  console.log('[CHATS] GET hit: userType=%s hasIdentityId=%s', userType, !!identityId)

  try {
    if (!identityId || !userType) {
      console.warn('[CHATS] Missing identityId or userType')
      return Response.json({ error: 'Missing identityId or userType' }, { status: 400 })
    }

    const userRows = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
    if (userRows.length === 0) {
      console.log('[CHATS] User not found — returning empty list: identityId=%s', identityId.slice(0, 10) + '…')
      return Response.json({ chats: [] })
    }

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userRows[0].id))
      .orderBy(desc(chats.updatedAt))

    console.log('[CHATS] OK: returned %d chats for userId=%s', userChats.length, userRows[0].id.slice(0, 8) + '…')
    return Response.json({ chats: userChats })
  } catch (err) {
    console.error('[CHATS] Error: %s', err instanceof Error ? err.message : String(err))
    if (err instanceof Error) console.error('[CHATS] Stack:', err.stack)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
