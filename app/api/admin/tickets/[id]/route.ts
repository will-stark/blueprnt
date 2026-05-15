import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth/is-admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const body = await req.json()
    const { identityType, identityId, email, status, note } = body as {
      identityType?: string
      identityId?: string
      email?: string
      status?: string
      note?: string
    }

    if (!isAdmin(identityType ?? null, identityId ?? null, email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (status) updates.status = status
    if (note?.trim()) {
      const existingNotes = (existing.notes as Array<{ text: string; createdAt: string }>) ?? []
      updates.notes = [...existingNotes, { text: note.trim(), createdAt: new Date().toISOString() }]
    }

    const [updated] = await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning()

    return NextResponse.json({ ok: true, notes: updated.notes, status: updated.status })
  } catch (err) {
    console.error('[ADMIN-TICKETS-PATCH] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
