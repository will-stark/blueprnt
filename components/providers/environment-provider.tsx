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
    async function detectEnvironment() {
      try {
        // Dynamic import — SDK is client-only and breaks SSR if imported statically
        const { sdk } = await import('@farcaster/miniapp-sdk')

        const isMiniApp = await Promise.race([
          sdk.isInMiniApp(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
        ])

        if (isMiniApp) {
          const context = await sdk.context
          const fc = context.user
          setUser({
            type: 'farcaster',
            farcaster: {
              fid: fc.fid,
              username: fc.username,
              displayName: fc.displayName,
              pfpUrl: fc.pfpUrl,
            },
          })
          // Fire-and-forget — do not block rendering
          fetch('/api/auth/upsert-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identityType: 'farcaster',
              identityId: String(fc.fid),
              username: fc.username,
              pfpUrl: fc.pfpUrl,
            }),
          }).catch(() => {}) // silent — upsert failure should never surface to user
          await sdk.actions.ready()
        } else {
          // Web mode — PrivySyncBridge below will update this once Privy resolves
          setUser({ type: 'anonymous' })
        }
      } catch {
        setUser({ type: 'anonymous' })
      } finally {
        setIsLoading(false)
        setIsReady(true)
      }
    }

    detectEnvironment()
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
