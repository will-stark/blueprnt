import { db } from './index'
import { users } from './schema'
import { eq } from 'drizzle-orm'

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

  if (existing.length > 0) {
    // Always refresh profile fields so wallet address and display info stay current
    await db
      .update(users)
      .set({
        lastSeenAt: new Date(),
        ...(walletAddress !== undefined && { walletAddress }),
        ...(username !== undefined && { username }),
        ...(pfpUrl !== undefined && { pfpUrl }),
        ...(email !== undefined && { email }),
      })
      .where(eq(users.identityId, identityId))
    return existing[0]
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
    })
    .returning()

  return newUser
}
