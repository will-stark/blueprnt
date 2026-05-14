import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, chats, messages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { AnonChatState } from '@/lib/anon-migration'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const privyId: string | undefined = body.privyId
    const anonState: AnonChatState | null = body.anonState ?? null

    if (!privyId) {
      return NextResponse.json({ error: 'Missing privyId' }, { status: 400 })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.identityId, privyId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (anonState && anonState.messages.length > 0) {
      const [chat] = await db
        .insert(chats)
        .values({
          userId: user.id,
          title: anonState.title || 'New chat',
          editsRemaining: 3,
        })
        .returning()

      const msgRows = anonState.messages.map((m) => ({
        chatId: chat.id,
        role: m.role,
        content: m.content,
      }))

      if (msgRows.length > 0) {
        await db.insert(messages).values(msgRows)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/auth/migrate-anon]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
