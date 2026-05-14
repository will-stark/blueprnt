import { NextRequest, NextResponse } from 'next/server'
import { upsertUser } from '@/lib/db/users'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identityType, identityId, email, username, walletAddress, pfpUrl } = body

    if (!identityType || !identityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (identityType !== 'farcaster' && identityType !== 'privy') {
      return NextResponse.json({ error: 'Invalid identityType' }, { status: 400 })
    }

    const user = await upsertUser({ identityType, identityId, email, username, walletAddress, pfpUrl })
    return NextResponse.json({ user })
  } catch (err) {
    console.error('[upsert-user]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
