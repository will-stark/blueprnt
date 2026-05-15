'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { SlideUp } from '@/components/ui/slide-up'
import type { UserType } from '@/lib/mock-data'

const TIP_AMOUNTS = [5, 10, 15]

// All payments on Base — no network selector needed.
const NETWORK_NAME = 'Base'

// Registered users (Farcaster / Privy) see the full tip modal
interface TipModalProps {
  onClose: () => void
  userType: UserType
}

export function TipModal({ onClose, userType }: TipModalProps) {
  const [selected, setSelected] = useState<number | null>(null)

  // Suppress unused-var lint until wired to real payment logic
  void userType

  return (
    <Modal title="Support the developer" onClose={onClose}>
      <div className="p-6 space-y-5">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Building {process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'} is a solo effort. Tips go directly to the developer and keep the app running and improving.
        </p>

        {/* Network indicator — Base only */}
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
            Network: {NETWORK_NAME}
          </span>
        </div>

        {/* Mock balance */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-lg border-[0.5px] border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-raised)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Wallet balance</span>
          <span className="font-mono text-[13px]" style={{ color: 'var(--text-primary)' }}>24.50 USDC</span>
        </div>

        {/* Amount selector */}
        <div className="grid grid-cols-3 gap-2">
          {TIP_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelected(amount)}
              className="py-3 rounded-xl border-[0.5px] text-[13px] md:text-[14px] font-medium transition-all duration-200"
              style={{
                borderColor: selected === amount ? 'var(--accent)' : 'var(--border)',
                backgroundColor: selected === amount ? 'var(--accent-light)' : 'var(--bg-surface)',
                color: selected === amount ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              ${amount}
            </button>
          ))}
        </div>

        <button
          disabled={selected === null}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {selected === null ? 'Select an amount' : `Send $${selected} tip`}
        </button>
      </div>
    </Modal>
  )
}

// Anonymous users see wallet addresses to send manually
interface SupportPopupProps {
  onClose: () => void
}

const MOCK_WALLETS = {
  base: '0x3f9e4b2d1a8c7f6e5d4c3b2a1f9e8d7c6b5a4f3e',
}

function WalletRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false)
  const short = `${address.slice(0, 10)}...${address.slice(-8)}`

  const handleCopy = () => {
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
        <button
          onClick={handleCopy}
          aria-label={`Copy ${label} address`}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-[var(--bg-muted)]"
          style={{ color: 'var(--accent)' }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
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
        <WalletRow label="Base" address={MOCK_WALLETS.base} />
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
