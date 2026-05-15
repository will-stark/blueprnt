'use client'

import { useState } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { CREDIT_OPTIONS } from '@/lib/mock-data'
import { SKU, type SkuId } from '@/lib/contracts'
import { usePayment } from '@/hooks/use-payment'
import { WalletSummary } from '@/components/payments/wallet-summary'
import type { UserType } from '@/lib/mock-data'

interface PurchaseModalProps {
  onClose: () => void
  userType: UserType
  identityId?: string | null
  walletAddress?: string | null
  onSuccess?: (creditsAdded: number) => void
}

// Ordered to match CREDIT_OPTIONS tiers 0–3
const TIER_TO_SKU: SkuId[] = [SKU.CREDIT_1, SKU.CREDIT_2, SKU.CREDIT_12, SKU.CREDIT_25]

const STATUS_LABEL: Record<string, string> = {
  checking:   'Checking wallet…',
  approving:  'Approving USDC spend…',
  purchasing: 'Sending payment…',
  confirming: 'Confirming purchase…',
  success:    'Purchase complete!',
}

export function PurchaseModal({
  onClose,
  userType,
  identityId,
  walletAddress,
  onSuccess,
}: PurchaseModalProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { status, error, pay, reset } = usePayment()

  const isBusy = status !== 'idle' && status !== 'success' && status !== 'error'
  const isSuccess = status === 'success'

  async function handlePurchase() {
    if (selected === null || !identityId || !walletAddress) return
    const sku = TIER_TO_SKU[selected]

    await pay({
      sku,
      userType: userType as 'farcaster' | 'privy',
      identityId,
      walletAddress,
      onSuccess: ({ creditsAdded }) => {
        setRefreshKey((k) => k + 1)
        onSuccess?.(creditsAdded ?? 0)
      },
    })
  }

  if (isSuccess) {
    const credits = selected !== null ? CREDIT_OPTIONS[selected].blueprints : 0
    return (
      <Modal title="Purchase complete" onClose={onClose}>
        <div className="p-6 space-y-4 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--success-light)' }}
          >
            <Check className="w-6 h-6" style={{ color: 'var(--success)' }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {credits} credit{credits !== 1 ? 's' : ''} added to your account.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Purchase credits" onClose={isBusy ? undefined : onClose}>
      <div className="p-6 space-y-5">
        {/* Network indicator */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-[0.5px] border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-raised)' }}
        >
          <img
            src="/images/base_logo.webp"
            alt="Base"
            className="w-5 h-5 rounded-full shrink-0 object-cover"
          />
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Network: Base · USDC
          </span>
        </div>

        {/* Wallet balance panel */}
        <WalletSummary walletAddress={walletAddress} refreshTrigger={refreshKey} />

        {/* Credit options */}
        <div className="space-y-2">
          {CREDIT_OPTIONS.map((option) => (
            <button
              key={option.tier}
              onClick={() => { if (!isBusy) { setSelected(option.tier); reset() } }}
              disabled={isBusy}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px] text-left transition-all duration-200 hover:border-[var(--border-strong)] disabled:opacity-60"
              style={{
                borderColor: selected === option.tier ? 'var(--accent)' : 'var(--border)',
                backgroundColor: selected === option.tier ? 'var(--accent-light)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span className="text-[13px] font-medium block" style={{ color: 'var(--text-primary)' }}>
                  {option.label}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {option.blueprints} {option.blueprints === 1 ? 'blueprint' : 'blueprints'} · {option.edits} edits each
                  {option.perGen && ` · ${option.perGen}/gen`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {option.price}
                </span>
                {selected === option.tier && !isBusy && (
                  <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Status / progress */}
        {isBusy && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)]"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {STATUS_LABEL[status] ?? 'Processing…'}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl border-[0.5px] border-[var(--danger)] text-[13px]"
            style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA */}
        {!isBusy && (
          <button
            onClick={handlePurchase}
            disabled={selected === null || !identityId || !walletAddress}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {selected === null
              ? 'Select an option'
              : `Purchase ${CREDIT_OPTIONS[selected].label.toLowerCase()}`}
          </button>
        )}

        <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
          Payments are onchain and non-refundable.
        </p>
      </div>
    </Modal>
  )
}
