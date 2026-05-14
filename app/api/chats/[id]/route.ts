import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chats, messages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

// GET /api/chats/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('[CHATS/ID] GET hit: chatId=%s', id.slice(0, 8) + '…')

  try {
    const chatRows = await db.select().from(chats).where(eq(chats.id, id)).limit(1)
    if (chatRows.length === 0) {
      console.warn('[CHATS/ID] Chat not found: chatId=%s', id)
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(asc(messages.createdAt))

    console.log('[CHATS/ID] OK: chatId=%s msgCount=%d', id.slice(0, 8) + '…', chatMessages.length)
    return Response.json({ chat: chatRows[0], messages: chatMessages })
  } catch (err) {
    console.error('[CHATS/ID] Error for chatId=%s: %s', id, err instanceof Error ? err.message : String(err))
    if (err instanceof Error) console.error('[CHATS/ID] Stack:', err.stack)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
