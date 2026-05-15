'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { USDC_ADDRESS, ERC20_ABI } from '@/lib/contracts'

const publicClient = createPublicClient({
  chain: base,
  transport: http(
    typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org')
      : 'https://mainnet.base.org'
  ),
})

export interface WalletBalances {
  ethBalance: string | null   // formatted e.g. "0.0042"
  usdcBalance: string | null  // formatted e.g. "12.50"
  isLoading: boolean
  error: boolean
  refresh: () => void
}

export function useWalletBalances(walletAddress: string | null | undefined): WalletBalances {
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetch = useCallback(async () => {
    if (!walletAddress) return
    setIsLoading(true)
    setError(false)

    try {
      const addr = walletAddress as `0x${string}`
      const [eth, usdc] = await Promise.all([
        publicClient.getBalance({ address: addr }),
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [addr],
        }),
      ])

      // ETH: 18 decimals — show 4 decimal places
      const ethNum = Number(eth) / 1e18
      setEthBalance(ethNum.toFixed(4))

      // USDC: 6 decimals — show 2 decimal places
      const usdcNum = Number(usdc) / 1_000_000
      setUsdcBalance(usdcNum.toFixed(2))
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ethBalance, usdcBalance, isLoading, error, refresh: fetch }
}
