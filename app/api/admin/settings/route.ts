import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { isAdmin } from '@/lib/auth/is-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identityType, identityId, email, anonymousEnabled } = body as {
      identityType?: string
      identityId?: string
      email?: string
      anonymousEnabled?: boolean
    }

    if (!isAdmin(identityType ?? null, identityId ?? null, email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (typeof anonymousEnabled !== 'boolean') {
      return NextResponse.json({ error: 'anonymousEnabled must be a boolean' }, { status: 400 })
    }

    await db.insert(events).values({
      txHash: `anon-toggle-${identityId ?? 'admin'}-${Date.now()}`,
      fromAddress: identityId ?? 'admin',
      toAddress: 'system',
      amountUsdc: '0',
      blockNumber: 0,
      eventType: 'admin_toggle_anon',
      metadata: {
        enabled: anonymousEnabled,
        adminIdentityId: identityId,
        timestamp: new Date().toISOString(),
      },
    })

    console.log('[ADMIN-SETTINGS] anonymousEnabled=%s by %s', anonymousEnabled, identityId)
    return NextResponse.json({ ok: true, anonymousEnabled })
  } catch (err) {
    console.error('[ADMIN-SETTINGS] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
