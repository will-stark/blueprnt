'use client'

import { useState, useEffect, useRef } from 'react'
import { Copy, Check, RefreshCw, Wallet } from 'lucide-react'
import { useWalletBalances } from '@/hooks/use-wallet-balances'

interface WalletSummaryProps {
  walletAddress: string | null | undefined
  refreshTrigger?: number
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function WalletSummary({ walletAddress, refreshTrigger }: WalletSummaryProps) {
  const [copied, setCopied] = useState(false)
  const { ethBalance, usdcBalance, isLoading, error, refresh } = useWalletBalances(walletAddress)

  // Re-fetch when parent increments refreshTrigger after a purchase
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    if (refreshTrigger !== undefined) refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  function handleCopy() {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!walletAddress) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-[0.5px]"
        style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border)' }}
      >
        <Wallet className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-faint)' }} />
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          No wallet connected
        </span>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border-[0.5px] overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-raised)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b-[0.5px]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Your Base wallet
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          aria-label="Refresh balances"
          className="p-1 rounded-md transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
            style={{ color: 'var(--text-faint)' }}
          />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Address + copy */}
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[12px] truncate mr-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {shorten(walletAddress)}
          </span>
          <button
            onClick={handleCopy}
            aria-label="Copy wallet address"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium shrink-0 transition-colors hover:bg-[var(--bg-muted)]"
            style={{ color: 'var(--accent)' }}
          >
            {copied
              ? <><Check className="w-3 h-3" />Copied</>
              : <><Copy className="w-3 h-3" />Copy</>
            }
          </button>
        </div>

        {/* Balances */}
        {error ? (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Could not load balances
          </p>
        ) : isLoading ? (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Loading balances…
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <BalancePill label="USDC" value={usdcBalance} color="var(--accent)" />
            <BalancePill label="ETH" value={ethBalance} color="var(--text-secondary)" />
          </div>
        )}

        {/* Funding hint */}
        <div className="space-y-0.5">
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Send USDC here to fund purchases
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Keep a small ETH balance for gas (~$0.01)
          </p>
        </div>
      </div>
    </div>
  )
}

function BalancePill({ label, value, color }: { label: string; value: string | null; color: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span
        className="text-[12px] font-medium tabular-nums"
        style={{ color }}
      >
        {value ?? '—'}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
        {label}
      </span>
    </div>
  )
}
