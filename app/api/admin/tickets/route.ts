import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth/is-admin'

function formatUserDisplay(
  identityType: string | null,
  identityId: string | null,
  username: string | null | undefined,
  email: string | null | undefined,
): string {
  if (!identityId) return 'Unknown'
  if (identityType === 'farcaster') {
    return username ? `${username} (FID ${identityId})` : `FID ${identityId}`
  }
  if (identityType === 'privy') {
    return email ?? username ?? identityId
  }
  return identityId
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
    const rows = await db
      .select({
        ticket: tickets,
        username: users.username,
        userEmail: users.email,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .orderBy(desc(tickets.createdAt))
      .limit(200)

    const result = rows.map(({ ticket, username, userEmail }) => ({
      id: ticket.id,
      shortId: ticket.id.replace(/-/g, '').slice(0, 8),
      userId: ticket.userId ?? undefined,
      identityType: ticket.identityType,
      identityId: ticket.identityId,
      userDisplay: formatUserDisplay(ticket.identityType, ticket.identityId, username, userEmail),
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as 'open' | 'in_progress' | 'resolved',
      createdAt: ticket.createdAt?.toISOString() ?? new Date().toISOString(),
      notes: (ticket.notes as Array<{ text: string; createdAt: string }>) ?? [],
    }))

    return NextResponse.json({ tickets: result })
  } catch (err) {
    console.error('[ADMIN-TICKETS] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
