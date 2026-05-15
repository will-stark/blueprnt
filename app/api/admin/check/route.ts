import { NextRequest, NextResponse } from 'next/server'

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean))
}

function getAdminFids(): Set<string> {
  const raw = process.env.ADMIN_FIDS ?? ''
  return new Set(raw.split(',').map((f) => f.trim()).filter(Boolean))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const identityType = searchParams.get('identityType') as 'farcaster' | 'privy' | null
  const identityId = searchParams.get('identityId')
  const email = searchParams.get('email')

  const adminEmails = getAdminEmails()
  const adminFids = getAdminFids()
  console.log('[ADMIN-CHECK] GET hit: identityType=%s hasIdentityId=%s hasEmail=%s adminEmailCount=%d adminFidCount=%d',
    identityType, !!identityId, !!email, adminEmails.size, adminFids.size)

  if (!identityType || !identityId) {
    console.log('[ADMIN-CHECK] Missing params — returning isAdmin=false')
    return NextResponse.json({ isAdmin: false })
  }

  let isAdmin = false

  if (identityType === 'farcaster') {
    isAdmin = adminFids.has(identityId)
  } else if (identityType === 'privy') {
    if (!email) {
      console.warn('[ADMIN-CHECK] privy check skipped — email param is empty')
    } else {
      isAdmin = adminEmails.has(email.toLowerCase())
    }
  }

  console.log('[ADMIN-CHECK] Result: identityType=%s isAdmin=%s', identityType, isAdmin)
  return NextResponse.json({ isAdmin })
}
