import { NextRequest, NextResponse } from 'next/server'
import { isAnonymousLimitHit } from '@/lib/db/anonymous-limit'

export async function GET(req: NextRequest) {
  try {
    const anonymousId = new URL(req.url).searchParams.get('anonymousId')
    if (!anonymousId) {
      return NextResponse.json({ credits: 1 })
    }

    const limitHit = await isAnonymousLimitHit(anonymousId)
    return NextResponse.json({ credits: limitHit ? 0 : 1 })
  } catch {
    return NextResponse.json({ credits: 1 })
  }
}
