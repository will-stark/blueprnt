import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, chats } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/chats?identityId=X&userType=farcaster|privy
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const identityId = searchParams.get('identityId')
    const userType = searchParams.get('userType')

    if (!identityId || !userType) {
      return Response.json({ error: 'Missing identityId or userType' }, { status: 400 })
    }

    const userRows = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
    if (userRows.length === 0) {
      return Response.json({ chats: [] })
    }

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userRows[0].id))
      .orderBy(desc(chats.updatedAt))

    return Response.json({ chats: userChats })
  } catch (err) {
    console.error('[API] GET /api/chats error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
