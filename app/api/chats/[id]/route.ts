import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chats, messages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

// GET /api/chats/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const chatRows = await db.select().from(chats).where(eq(chats.id, id)).limit(1)
    if (chatRows.length === 0) {
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(asc(messages.createdAt))

    return Response.json({ chat: chatRows[0], messages: chatMessages })
  } catch (err) {
    console.error('[API] GET /api/chats/[id] error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
