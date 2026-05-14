'use client'

import { useEffect, useRef } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import type { AppUser } from '@/components/providers/environment-provider'
import { migrateAnonUser } from '@/lib/anon-migration'

export function usePrivySync(
  setUser: (user: AppUser) => void,
  isFarcaster: boolean
) {
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const didMigrateRef = useRef(false)

  useEffect(() => {
    // Never override a Farcaster session with Privy state
    if (isFarcaster) return
    if (!ready) return

    if (authenticated && user) {
      const email =
        user.google?.email ??
        user.apple?.email ??
        user.email?.address ??
        undefined

      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
      const walletAddress = embeddedWallet?.address

      setUser({ type: 'privy', privyId: user.id, email, walletAddress })

      // Fire-and-forget upsert — never block auth flow on this
      fetch('/api/auth/upsert-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityType: 'privy',
          identityId: user.id,
          email,
          walletAddress,
        }),
      }).catch(() => {})

      // Migrate anonymous chat state once per login session
      if (!didMigrateRef.current) {
        didMigrateRef.current = true
        migrateAnonUser(user.id)
      }
    } else {
      setUser({ type: 'anonymous' })
    }
  }, [ready, authenticated, user, wallets, isFarcaster, setUser])
}
