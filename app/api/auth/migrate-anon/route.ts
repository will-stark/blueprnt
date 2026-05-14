import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, chats, messages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { AnonChatState } from '@/lib/anon-migration'

export async function POST(req: NextRequest) {
  console.log('[MIGRATE-ANON] POST hit:', new Date().toISOString())

  try {
    const body = await req.json()
    const privyId: string | undefined = body.privyId
    const anonState: AnonChatState | null = body.anonState ?? null

    console.log('[MIGRATE-ANON] privyId=%s hasAnonState=%s msgCount=%d',
      privyId ? privyId.slice(0, 10) + '…' : 'missing',
      !!anonState,
      anonState?.messages?.length ?? 0,
    )

    if (!privyId) {
      console.warn('[MIGRATE-ANON] Missing privyId')
      return NextResponse.json({ error: 'Missing privyId' }, { status: 400 })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.identityId, privyId))
      .limit(1)

    if (!user) {
      console.warn('[MIGRATE-ANON] User not found: privyId=%s', privyId.slice(0, 10) + '…')
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

      console.log('[MIGRATE-ANON] Migrated %d messages into chatId=%s',
        msgRows.length, chat.id.slice(0, 8) + '…')
    } else {
      console.log('[MIGRATE-ANON] No messages to migrate — skipping chat insert')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[MIGRATE-ANON] Error: %s', err instanceof Error ? err.message : String(err))
    if (err instanceof Error) console.error('[MIGRATE-ANON] Stack:', err.stack)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
