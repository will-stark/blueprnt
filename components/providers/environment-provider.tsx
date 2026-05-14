'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePrivySync } from '@/hooks/use-privy-sync'

export type UserType = 'farcaster' | 'privy' | 'anonymous'

export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

export interface AppUser {
  type: UserType
  farcaster?: FarcasterUser
  privyId?: string
  email?: string
  walletAddress?: string
  platformType?: 'mobile' | 'web'
}

interface EnvironmentContextValue {
  user: AppUser | null
  isLoading: boolean
  isReady: boolean
  setUser: (user: AppUser) => void
}

const EnvironmentContext = createContext<EnvironmentContextValue>({
  user: null,
  isLoading: true,
  isReady: false,
  setUser: () => {},
})

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function detectEnvironment() {
      try {
        // Dynamic import — SDK is client-only and breaks SSR if imported statically
        const { sdk } = await import('@farcaster/miniapp-sdk')

        const isMiniApp = await Promise.race([
          sdk.isInMiniApp(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
        ])

        if (!mounted) return

        if (isMiniApp) {
          const context = await sdk.context
          if (!mounted) return

          const fc = context.user
          const platformType = (context.client as { platformType?: string } | undefined)?.platformType as 'mobile' | 'web' | undefined
          console.log('[env] platformType:', platformType)
          setUser({
            type: 'farcaster',
            farcaster: {
              fid: fc.fid,
              username: fc.username,
              displayName: fc.displayName,
              pfpUrl: fc.pfpUrl,
            },
            platformType,
          })
          // Fire-and-forget — do not block rendering
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fcWalletAddress: string | undefined = (fc as any).wallet?.address
          fetch('/api/auth/upsert-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identityType: 'farcaster',
              identityId: String(fc.fid),
              username: fc.username,
              pfpUrl: fc.pfpUrl,
              walletAddress: fcWalletAddress,
            }),
          }).catch(() => {}) // silent — upsert failure should never surface to user

          // Delay ready() so state and DOM are settled before dismissing splash
          setTimeout(() => { sdk.actions.ready().catch(() => {}) }, 100)
        } else {
          // Web mode — PrivySyncBridge below will update this once Privy resolves
          setUser({ type: 'anonymous' })
        }
      } catch {
        if (mounted) setUser({ type: 'anonymous' })
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsReady(true)
        }
      }
    }

    detectEnvironment()

    return () => { mounted = false }
  }, [])

  return (
    <EnvironmentContext.Provider value={{ user, isLoading, isReady, setUser }}>
      {/* PrivySyncBridge is always mounted so hooks inside are always called */}
      <PrivySyncBridge />
      {children}
    </EnvironmentContext.Provider>
  )
}

// Mounts only in web mode. Calls usePrivySync unconditionally (hooks are always
// called; the guard against overriding Farcaster is inside the hook).
function PrivySyncBridge() {
  const { user, setUser } = useContext(EnvironmentContext)
  usePrivySync(setUser, user?.type === 'farcaster')
  return null
}

export function useEnvironment() {
  return useContext(EnvironmentContext)
}
