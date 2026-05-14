import { NextRequest, NextResponse } from 'next/server'
import { isAnonymousLimitHit } from '@/lib/db/anonymous-limit'

export async function GET(req: NextRequest) {
  const anonymousId = new URL(req.url).searchParams.get('anonymousId')
  console.log('[ANON-CREDITS] GET hit: hasAnonId=%s', !!anonymousId)

  try {
    if (!anonymousId) {
      console.warn('[ANON-CREDITS] Missing anonymousId — defaulting to 1 credit')
      return NextResponse.json({ credits: 1 })
    }

    const limitHit = await isAnonymousLimitHit(anonymousId)
    const credits = limitHit ? 0 : 1
    console.log('[ANON-CREDITS] anonId=%s limitHit=%s credits=%d',
      anonymousId.slice(0, 8) + '…', limitHit, credits)
    return NextResponse.json({ credits })
  } catch (err) {
    console.error('[ANON-CREDITS] Error: %s', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ credits: 1 })
  }
}
