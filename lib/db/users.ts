import { db } from './index'
import { users } from './schema'
import { eq } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth/is-admin'

export async function upsertUser({
  identityType,
  identityId,
  email,
  username,
  walletAddress,
  pfpUrl,
}: {
  identityType: 'farcaster' | 'privy'
  identityId: string
  email?: string
  username?: string
  walletAddress?: string
  pfpUrl?: string
}) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.identityId, identityId))
    .limit(1)

  const adminFlag = isAdmin(identityType, identityId, email)

  if (existing.length > 0) {
    // Always refresh profile fields so wallet address and display info stay current
    const [updated] = await db
      .update(users)
      .set({
        lastSeenAt: new Date(),
        isAdmin: adminFlag,
        ...(walletAddress !== undefined && { walletAddress }),
        ...(username !== undefined && { username }),
        ...(pfpUrl !== undefined && { pfpUrl }),
        ...(email !== undefined && { email }),
      })
      .where(eq(users.identityId, identityId))
      .returning()
    return { user: updated, isNew: false }
  }

  const [newUser] = await db
    .insert(users)
    .values({
      identityType,
      identityId,
      email,
      username,
      walletAddress,
      pfpUrl,
      creditsRemaining: 3,
      isAdmin: adminFlag,
    })
    .returning()

  return { user: newUser, isNew: true }
}
