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
      console.log('[FC-DEBUG] Starting environment detection...', {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      })

      try {
        // Dynamic import — SDK is client-only and breaks SSR if imported statically
        console.log('[FC-DEBUG] Attempting to import Farcaster SDK...')
        const { sdk } = await import('@farcaster/miniapp-sdk')
        console.log('[FC-DEBUG] SDK imported successfully:', {
          sdkExists: !!sdk,
          sdkKeys: Object.keys(sdk),
        })

        console.log('[FC-DEBUG] Checking if in Farcaster mini-app...')
        const isMiniApp = await Promise.race([
          sdk.isInMiniApp(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
        ])
        console.log('[FC-DEBUG] isInMiniApp result:', {
          isMiniApp,
          contextAvailable: !!sdk.context,
        })

        if (!mounted) return

        if (isMiniApp) {
          console.log('[FC-DEBUG] Detected Farcaster environment, extracting context...')
          const context = await sdk.context
          if (!mounted) return

          const fc = context.user
          const platformType = (context.client as { platformType?: string } | undefined)?.platformType as 'mobile' | 'web' | undefined
          console.log('[FC-DEBUG] Context extracted:', {
            hasFid: !!fc?.fid,
            fid: fc?.fid,
            hasUsername: !!fc?.username,
            username: fc?.username,
            hasPfp: !!fc?.pfpUrl,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hasWallet: !!(fc as any)?.wallet?.address,
            clientType: (context.client as { clientType?: string } | undefined)?.clientType,
            platformType,
          })

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
          console.log('[FC-SUCCESS] User state set to Farcaster:', { fid: fc.fid, username: fc.username })

          // Get primary transaction wallet (the wallet used in Warpcast for transactions)
          let fcWalletAddress: string | undefined
          try {
            fcWalletAddress = await sdk.wallet.getAddress()
            console.log('[FC-DEBUG] Got primary wallet address from sdk.wallet.getAddress()')
          } catch {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fca = fc as any
            fcWalletAddress =
              fca.verifiedAddresses?.ethAddresses?.[0] ??
              fca.custodyAddress ??
              fca.custody
            console.log('[FC-DEBUG] Fell back to static wallet address')
          }
          console.log('[FC-DEBUG] Calling upsert-user API...')
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
          })
            .then(() => console.log('[FC-SUCCESS] upsert-user API call succeeded'))
            .catch((err) => console.error('[FC-ERROR] upsert-user API call failed:', err))

          // Delay ready() so state and DOM are settled before dismissing splash
          setTimeout(() => {
            console.log('[FC-DEBUG] Calling sdk.actions.ready()...')
            sdk.actions.ready()
              .then(() => console.log('[FC-SUCCESS] sdk.actions.ready() completed'))
              .catch((err) => console.error('[FC-ERROR] sdk.actions.ready() failed:', err))
          }, 100)
        } else {
          // Web mode — PrivySyncBridge below will update this once Privy resolves
          console.log('[FC-DEBUG] Not in Farcaster environment, defaulting to web mode')
          setUser({ type: 'anonymous' })
        }
      } catch (error) {
        console.error('[FC-ERROR] Environment detection failed:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        if (mounted) {
          console.log('[FC-DEBUG] Falling back to anonymous mode due to error')
          setUser({ type: 'anonymous' })
        }
      } finally {
        if (mounted) {
          console.log('[FC-DEBUG] Setting isReady=true, isLoading=false')
          setIsLoading(false)
          setIsReady(true)
        } else {
          console.log('[FC-DEBUG] Component unmounted before finally — skipping state updates')
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
