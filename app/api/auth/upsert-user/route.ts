import { NextRequest, NextResponse } from 'next/server'
import { upsertUser } from '@/lib/db/users'

export async function POST(req: NextRequest) {
  console.log('[API-DEBUG] /api/auth/upsert-user called')

  try {
    const body = await req.json()
    const { identityType, identityId, email, username, walletAddress, pfpUrl } = body

    console.log('[API-DEBUG] Request body:', {
      identityType,
      identityId,
      hasEmail: !!email,
      hasUsername: !!username,
      hasWallet: !!walletAddress,
      hasPfp: !!pfpUrl,
    })

    if (!identityType || !identityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (identityType !== 'farcaster' && identityType !== 'privy') {
      return NextResponse.json({ error: 'Invalid identityType' }, { status: 400 })
    }

    const user = await upsertUser({ identityType, identityId, email, username, walletAddress, pfpUrl })
    console.log('[API-SUCCESS] User upserted:', {
      userId: user.id,
      identityType: user.identityType,
      creditsRemaining: user.creditsRemaining,
    })
    return NextResponse.json({ user })
  } catch (err) {
    console.error('[API-ERROR] upsert-user failed:', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
