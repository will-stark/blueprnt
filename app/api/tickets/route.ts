import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets, users, events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { alertTicket } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identityId, identityType, title, description } = body as {
      identityId?: string
      identityType?: string
      title?: string
      description?: string
    }

    if (!identityId || !identityType) {
      return NextResponse.json({ error: 'identityId and identityType required' }, { status: 400 })
    }
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'title and description required' }, { status: 400 })
    }

    const [user] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.identityId, identityId))
      .limit(1)

    const [ticket] = await db
      .insert(tickets)
      .values({
        userId: user?.id,
        identityType,
        identityId,
        title: title.trim().slice(0, 100),
        description: description.trim().slice(0, 1000),
      })
      .returning()

    // Log for admin dashboard (non-critical)
    db.insert(events)
      .values({
        txHash: `ticket-${identityId}-${Date.now()}`,
        fromAddress: identityId,
        toAddress: 'system',
        amountUsdc: '0',
        blockNumber: 0,
        eventType: 'ticket_submitted',
        metadata: { identityId, ticketId: ticket.id },
      })
      .catch(() => {})

    alertTicket({
      identityId,
      username: user?.username,
      title: title.trim(),
      description: description.trim(),
    }).catch(() => {})

    const shortId = ticket.id.replace(/-/g, '').slice(0, 8)
    console.log('[TICKETS] Created: id=%s shortId=%s', ticket.id, shortId)
    return NextResponse.json({ id: ticket.id, shortId })
  } catch (err) {
    console.error('[TICKETS] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
