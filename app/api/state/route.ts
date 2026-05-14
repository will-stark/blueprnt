import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Anonymous toggle — DB-backed toggle will replace this in a later phase
const ANONYMOUS_ALLOWED = true

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const identityId   = searchParams.get('identityId')
    const identityType = searchParams.get('identityType') as 'farcaster' | 'privy' | null

    if (!identityId || !identityType) {
      return NextResponse.json({
        userType: 'anonymous',
        anonymousAllowed: ANONYMOUS_ALLOWED,
        creditsRemaining: null,
        editsRemaining: null,
      })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.identityId, identityId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      userType: identityType,
      anonymousAllowed: ANONYMOUS_ALLOWED,
      creditsRemaining: user.creditsRemaining,
      giftedCycleExpiresAt: user.giftedCycleExpiresAt,
      creditCycleExpiresAt: user.creditCycleExpiresAt,
    })
  } catch (err) {
    console.error('[api/state]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
