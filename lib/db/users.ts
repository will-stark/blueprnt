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
    // Update lastSeenAt on every login
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
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
