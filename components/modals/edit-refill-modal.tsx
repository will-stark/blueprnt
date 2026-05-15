'use client'

import { useState } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { SKU } from '@/lib/contracts'
import { usePayment } from '@/hooks/use-payment'
import { WalletSummary } from '@/components/payments/wallet-summary'
import type { UserType } from '@/lib/mock-data'

interface EditRefillModalProps {
  onClose: () => void
  userType: UserType
  identityId?: string | null
  walletAddress?: string | null
  chatId: string
  onSuccess?: (editsAdded: number) => void
}

const STATUS_LABEL: Record<string, string> = {
  checking:   'Checking wallet…',
  approving:  'Approving USDC spend…',
  purchasing: 'Sending payment…',
  confirming: 'Confirming purchase…',
  success:    'Purchase complete!',
}

export function EditRefillModal({
  onClose,
  userType,
  identityId,
  walletAddress,
  chatId,
  onSuccess,
}: EditRefillModalProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const { status, error, pay, reset } = usePayment()

  const isBusy = status !== 'idle' && status !== 'success' && status !== 'error'
  const isSuccess = status === 'success'

  async function handlePurchase() {
    if (!identityId || !walletAddress) return

    await pay({
      sku: SKU.EDIT_REFILL,
      userType: userType as 'farcaster' | 'privy',
      identityId,
      walletAddress,
      chatId,
      onSuccess: ({ editsAdded }) => {
        setRefreshKey((k) => k + 1)
        onSuccess?.(editsAdded ?? 10)
      },
    })
  }

  if (isSuccess) {
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
            10 edits added to this chat.
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
    <Modal title="Purchase edits" onClose={isBusy ? undefined : onClose}>
      <div className="p-6 space-y-5">
        {/* Network indicator */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-[0.5px] border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-raised)' }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
            style={{ backgroundColor: '#0052FF' }}
          >
            B
          </div>
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Network: Base · USDC
          </span>
        </div>

        {/* Wallet balance panel */}
        <WalletSummary walletAddress={walletAddress} refreshTrigger={refreshKey} />

        {/* SKU detail */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px]"
          style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-light)' }}
        >
          <div>
            <span className="text-[13px] font-medium block" style={{ color: 'var(--text-primary)' }}>
              10 edits
            </span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              For this chat only
            </span>
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
            $0.25
          </span>
        </div>

        {/* Status */}
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
            disabled={!identityId || !walletAddress}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Purchase 10 edits — $0.25
          </button>
        )}

        {error && !isBusy && (
          <button
            onClick={reset}
            className="w-full py-2 text-[13px] transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Try again
          </button>
        )}

        <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
          Payments are onchain and non-refundable.
        </p>
      </div>
    </Modal>
  )
}
