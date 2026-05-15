'use client'

import { useState, useCallback } from 'react'
import { useWallets } from '@privy-io/react-auth'
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
} from 'viem'
import { base } from 'viem/chains'
import {
  CHECKOUT_ADDRESS,
  USDC_ADDRESS,
  BASE_CHAIN_ID,
  SKU_PRICES,
  CHECKOUT_ABI,
  ERC20_ABI,
  chatIdToRef,
  type SkuId,
} from '@/lib/contracts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'idle'
  | 'checking'    // pre-flight: balance, network
  | 'approving'   // waiting for USDC approve tx to confirm
  | 'purchasing'  // waiting for purchase tx to confirm
  | 'confirming'  // calling /api/purchases/confirm
  | 'success'
  | 'error'

export interface PaymentResult {
  txHash: string
  creditsAdded?: number
  editsAdded?: number
}

export interface UsePaymentReturn {
  status: PaymentStatus
  error: string | null
  txHash: string | null
  pay: (opts: PayOpts) => Promise<void>
  reset: () => void
}

interface PayOpts {
  sku: SkuId
  userType: 'farcaster' | 'privy'
  identityId: string
  walletAddress: string   // expected buyer address (validated against event)
  chatId?: string         // required for sku=10 (edit refill)
  onSuccess?: (result: PaymentResult) => void
}

// ─── RPC client (Base mainnet) ────────────────────────────────────────────────

const publicClient = createPublicClient({
  chain: base,
  transport: http(
    typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org')
      : 'https://mainnet.base.org'
  ),
})

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePayment(): UsePaymentReturn {
  const { wallets } = useWallets()
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setTxHash(null)
  }, [])

  const pay = useCallback(async (opts: PayOpts) => {
    const { sku, userType, identityId, walletAddress, chatId, onSuccess } = opts

    if (!CHECKOUT_ADDRESS) {
      setError('Payments are not yet available. Please try again later.')
      setStatus('error')
      return
    }

    setStatus('checking')
    setError(null)
    setTxHash(null)

    try {
      // ── Get EIP-1193 provider ───────────────────────────────────────────────
      let provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }

      if (userType === 'farcaster') {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        provider = (await sdk.wallet.getEthereumProvider()) as typeof provider
      } else {
        const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
        if (!embeddedWallet) {
          throw new PaymentError('wallet_not_found', 'No embedded wallet found. Please sign in again.')
        }
        provider = await embeddedWallet.getEthereumProvider()
      }

      // ── Network check ───────────────────────────────────────────────────────
      const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string
      const chainId = parseInt(chainIdHex, 16)

      if (chainId !== BASE_CHAIN_ID) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
          })
        } catch {
          throw new PaymentError(
            'wrong_network',
            'Please switch your wallet to Base network and try again.'
          )
        }
      }

      const buyer = walletAddress as `0x${string}`
      const price = SKU_PRICES[sku]

      // ── Pre-flight: USDC balance ────────────────────────────────────────────
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [buyer],
      })

      if (balance < price) {
        const have = Number(balance) / 1_000_000
        const need = Number(price) / 1_000_000
        throw new PaymentError(
          'insufficient_usdc',
          `Insufficient USDC. You have ${have.toFixed(2)} USDC but need ${need.toFixed(2)} USDC.`
        )
      }

      // ── Pre-flight: ETH for gas ─────────────────────────────────────────────
      const ethBalance = await publicClient.getBalance({ address: buyer })
      if (ethBalance < 100_000_000_000_000n) { // ~0.0001 ETH
        throw new PaymentError(
          'insufficient_gas',
          'You need a small amount of ETH on Base for transaction fees (about $0.01 worth).'
        )
      }

      const walletClient = createWalletClient({
        account: buyer,
        chain: base,
        transport: custom(provider),
      })

      // ── Step 1: Approve USDC spend ──────────────────────────────────────────
      setStatus('approving')

      // Check existing allowance — skip approve if already sufficient
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [buyer, CHECKOUT_ADDRESS],
      })

      if (allowance < price) {
        let approveTxHash: `0x${string}`
        try {
          approveTxHash = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CHECKOUT_ADDRESS, price],
          })
        } catch (err) {
          throw classifyWalletError(err, 'approve')
        }

        await publicClient.waitForTransactionReceipt({
          hash: approveTxHash,
          timeout: 120_000,
        })
      }

      // ── Step 2: Call purchase ───────────────────────────────────────────────
      setStatus('purchasing')

      const ref: `0x${string}` =
        sku === 10 && chatId
          ? chatIdToRef(chatId)
          : '0x0000000000000000000000000000000000000000000000000000000000000000'

      let purchaseTxHash: `0x${string}`
      try {
        purchaseTxHash = await walletClient.writeContract({
          address: CHECKOUT_ADDRESS,
          abi: CHECKOUT_ABI,
          functionName: 'purchase',
          args: [sku, ref],
        })
      } catch (err) {
        throw classifyWalletError(err, 'purchase')
      }

      setTxHash(purchaseTxHash)

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: purchaseTxHash,
        timeout: 180_000,
      })

      if (receipt.status === 'reverted') {
        throw new PaymentError('tx_failed', 'Transaction failed on-chain. Please try again.')
      }

      // ── Step 3: Confirm with backend ────────────────────────────────────────
      setStatus('confirming')

      const confirmed = await confirmWithBackend({
        txHash: purchaseTxHash,
        sku,
        identityId,
        chatId,
      })

      setStatus('success')
      onSuccess?.({ txHash: purchaseTxHash, ...confirmed })
    } catch (err) {
      const msg =
        err instanceof PaymentError
          ? err.message
          : 'Something went wrong. Please try again.'
      setError(msg)
      setStatus('error')
    }
  }, [wallets])

  return { status, error, txHash, pay, reset }
}

// ─── Backend confirm (with retry) ────────────────────────────────────────────

async function confirmWithBackend(opts: {
  txHash: string
  sku: SkuId
  identityId: string
  chatId?: string
}): Promise<{ creditsAdded?: number; editsAdded?: number }> {
  const MAX_RETRIES = 4
  const RETRY_DELAY_MS = 2500

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch('/api/purchases/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })

    if (res.ok) {
      const data = await res.json()
      return { creditsAdded: data.creditsAdded, editsAdded: data.editsAdded }
    }

    // 404 = tx not yet indexed — retry
    if (res.status === 404 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
      continue
    }

    // 409 = already processed — idempotent success
    if (res.status === 409) {
      return {}
    }

    const body = await res.json().catch(() => ({}))
    throw new PaymentError(
      'backend_error',
      body.error ??
        'Payment sent but credits not yet applied. This will resolve automatically — contact support if it persists after 5 minutes.'
    )
  }

  throw new PaymentError(
    'backend_error',
    'Payment sent but credits not yet applied. This will resolve automatically — contact support if it persists after 5 minutes.'
  )
}

// ─── Error helpers ────────────────────────────────────────────────────────────

class PaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

function classifyWalletError(err: unknown, step: string): PaymentError {
  const msg = err instanceof Error ? err.message : String(err)
  const code = (err as { code?: number })?.code

  if (code === 4001 || msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
    return new PaymentError('wallet_rejected', 'Transaction cancelled.')
  }
  if (msg.toLowerCase().includes('insufficient funds')) {
    return new PaymentError('insufficient_gas', 'Not enough ETH for transaction fees on Base.')
  }
  console.error(`[PAYMENT] ${step} error:`, msg)
  return new PaymentError('tx_failed', `Transaction failed during ${step}. Please try again.`)
}
