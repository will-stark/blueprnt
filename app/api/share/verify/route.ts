import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { castMeetsRequirements, SHARE_REQUIRED_URL } from '@/lib/neynar'
import { hasClaimedThisWeek } from '@/lib/share'
import { alertShareVerificationFailed } from '@/lib/alerts'

const NEYNAR_API = 'https://api.neynar.com/v2'
const SHARE_CREDIT_REWARD = 2

interface SearchCast {
  hash: string
  text: string
  author: { fid: number }
  timestamp: string
}

async function findShareCast(fid: number): Promise<SearchCast | null> {
  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) return null

  const url = `${NEYNAR_API}/farcaster/cast/search?q=${encodeURIComponent(SHARE_REQUIRED_URL)}&author_fid=${fid}&limit=10`
  const res = await fetch(url, {
    headers: { api_key: apiKey, accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return null

  const data = await res.json()
  const casts: SearchCast[] = data?.result?.casts ?? []

  // Find the most recent qualifying cast from this FID
  for (const cast of casts) {
    if (cast.author.fid === fid && castMeetsRequirements(cast.text)) {
      return cast
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  let body: { identityId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { identityId } = body
  if (!identityId) {
    return NextResponse.json({ error: 'identityId required' }, { status: 400 })
  }

  const [user] = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Already claimed this week
  if (hasClaimedThisWeek(user.shareRewardLastClaimedAt ?? null)) {
    return NextResponse.json({ verified: false, reason: 'already_claimed' })
  }

  // FID is the identityId for Farcaster users — must be numeric
  const fid = parseInt(identityId, 10)
  if (isNaN(fid)) {
    return NextResponse.json({ verified: false, reason: 'not_farcaster_user' })
  }

  const cast = await findShareCast(fid)

  if (!cast) {
    // Second failure in a session — fire alert
    const failCount = (user as unknown as Record<string, unknown>)._shareFailCount
    if (failCount) {
      await alertShareVerificationFailed(identityId)
    }
    return NextResponse.json({ verified: false, reason: 'cast_not_found' })
  }

  // Award credits and mark claimed
  await db
    .update(users)
    .set({
      creditsRemaining: user.creditsRemaining + SHARE_CREDIT_REWARD,
      shareRewardLastClaimedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return NextResponse.json({
    verified: true,
    creditsAwarded: SHARE_CREDIT_REWARD,
    castHash: cast.hash,
  })
}
