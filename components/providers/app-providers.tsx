'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { base } from 'viem/chains'
import { ThemeProvider } from './theme-provider'
import { EnvironmentProvider } from './environment-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          loginMethods: ['google', 'apple'],
          appearance: {
            theme: 'light',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
            noPromptOnSignature: true,
          },
          defaultChain: base,
          supportedChains: [base],
          externalWallets: {
            coinbaseWallet: { connectionOptions: 'smartWalletOnly' },
          },
        }}
      >
        <EnvironmentProvider>
          {children}
        </EnvironmentProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}
