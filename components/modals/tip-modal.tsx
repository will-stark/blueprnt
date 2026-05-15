'use client'

import { useState } from 'react'
import { Copy, Check, Loader2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { SlideUp } from '@/components/ui/slide-up'
import { SKU, type SkuId } from '@/lib/contracts'
import { usePayment } from '@/hooks/use-payment'
import { WalletSummary } from '@/components/payments/wallet-summary'
import type { UserType } from '@/lib/mock-data'

const TIP_AMOUNTS = [
  { label: '$5',  sku: SKU.TIP_5  as SkuId },
  { label: '$10', sku: SKU.TIP_10 as SkuId },
  { label: '$15', sku: SKU.TIP_15 as SkuId },
]

const STATUS_LABEL: Record<string, string> = {
  checking:   'Checking wallet…',
  approving:  'Approving USDC spend…',
  purchasing: 'Sending tip…',
  confirming: 'Confirming…',
  success:    'Tip sent!',
}

interface TipModalProps {
  onClose: () => void
  userType: UserType
  identityId?: string | null
  walletAddress?: string | null
}

export function TipModal({ onClose, userType, identityId, walletAddress }: TipModalProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { status, error, pay, reset } = usePayment()

  const isBusy = status !== 'idle' && status !== 'success' && status !== 'error'
  const isSuccess = status === 'success'

  async function handleTip() {
    if (selected === null || !identityId || !walletAddress) return
    const sku = TIP_AMOUNTS[selected].sku

    await pay({
      sku,
      userType: userType as 'farcaster' | 'privy',
      identityId,
      walletAddress,
      onSuccess: () => {
        setRefreshKey((k) => k + 1)
      },
    })
  }

  if (isSuccess) {
    const label = selected !== null ? TIP_AMOUNTS[selected].label : ''
    return (
      <Modal title="Thank you!" onClose={onClose}>
        <div className="p-6 space-y-4 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--success-light)' }}
          >
            <Check className="w-6 h-6" style={{ color: 'var(--success)' }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {label} tip sent. You rock!
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
    <Modal title="Support the developer" onClose={isBusy ? undefined : onClose}>
      <div className="p-6 space-y-5">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Building {process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'} is a solo effort. Tips go directly to the developer and keep the app running and improving.
        </p>

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

        {/* Amount selector */}
        <div className="grid grid-cols-3 gap-2">
          {TIP_AMOUNTS.map((tip, i) => (
            <button
              key={tip.sku}
              onClick={() => { if (!isBusy) { setSelected(i); reset() } }}
              disabled={isBusy}
              className="py-3 rounded-xl border-[0.5px] text-[13px] md:text-[14px] font-medium transition-all duration-200 disabled:opacity-60"
              style={{
                borderColor: selected === i ? 'var(--accent)' : 'var(--border)',
                backgroundColor: selected === i ? 'var(--accent-light)' : 'var(--bg-surface)',
                color: selected === i ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              {tip.label}
            </button>
          ))}
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
            onClick={handleTip}
            disabled={selected === null || !identityId || !walletAddress}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {selected === null ? 'Select an amount' : `Send ${TIP_AMOUNTS[selected].label} tip`}
          </button>
        )}

        <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
          Tips are onchain and non-refundable.
        </p>
      </div>
    </Modal>
  )
}

// Anonymous users see the treasury wallet address to send manually
interface SupportPopupProps {
  onClose: () => void
}

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS ?? ''

function WalletRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false)
  const short = address ? `${address.slice(0, 10)}...${address.slice(-8)}` : 'Not configured'

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg border-[0.5px] border-[var(--border)]"
        style={{ backgroundColor: 'var(--bg-raised)' }}
      >
        <span className="font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>{short}</span>
        {address && (
          <button
            onClick={handleCopy}
            aria-label={`Copy ${label} address`}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-[var(--bg-muted)]"
            style={{ color: 'var(--accent)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}

export function SupportPopup({ onClose }: SupportPopupProps) {
  return (
    <SlideUp onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-[15px] md:text-[16px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Support the developer
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Send USDC on Base to support {process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'}. Thank you!
          </p>
        </div>
        <WalletRow label="Base" address={TREASURY_ADDRESS} />
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)] border-[0.5px] border-[var(--border)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Close
        </button>
      </div>
    </SlideUp>
  )
}
