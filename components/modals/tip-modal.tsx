'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { SlideUp } from '@/components/ui/slide-up'
import type { UserType } from '@/lib/mock-data'

const TIP_AMOUNTS = [5, 10, 15]

// Registered users (Farcaster / Privy) see the full tip modal
interface TipModalProps {
  onClose: () => void
  userType: UserType
}

type Network = 'base' | 'arbitrum'

export function TipModal({ onClose, userType }: TipModalProps) {
  const [network, setNetwork] = useState<Network>('base')
  const [selected, setSelected] = useState<number | null>(null)

  const isFarcaster = userType === 'farcaster'
  const isPrivy = userType === 'privy'

  return (
    <Modal title="Support the developer" onClose={onClose}>
      <div className="p-6 space-y-5">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Building Blueprnt is a solo effort. Tips go directly to the developer and keep the app running and improving.
        </p>

        {/* Farcaster: Base-only */}
        {isFarcaster && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-[0.5px] border-[var(--border)]"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white" style={{ backgroundColor: '#0052FF' }}>B</div>
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Payments on Base</span>
          </div>
        )}

        {/* Privy: network selector */}
        {isPrivy && (
          <div className="space-y-2">
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Network</p>
            <div className="grid grid-cols-2 gap-2">
              {(['base', 'arbitrum'] as Network[]).map((net) => (
                <button
                  key={net}
                  onClick={() => setNetwork(net)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-[0.5px] text-[13px] transition-all duration-200"
                  style={{
                    borderColor: network === net ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: network === net ? 'var(--accent-light)' : 'var(--bg-raised)',
                    color: network === net ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0"
                    style={{ backgroundColor: net === 'base' ? '#0052FF' : '#2D374B' }}
                  >
                    {net === 'base' ? 'B' : 'A'}
                  </div>
                  {net === 'base' ? 'Base' : 'Arbitrum'}
                </button>
              ))}
            </div>
          </div>
        )}

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
              className="py-3 rounded-xl border-[0.5px] text-[14px] font-medium transition-all duration-200"
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
  arbitrum: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
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
          <h3 className="text-[16px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Support the developer
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Send USDC to either address to support Blueprnt. Thank you!
          </p>
        </div>
        <WalletRow label="Base" address={MOCK_WALLETS.base} />
        <WalletRow label="Arbitrum One" address={MOCK_WALLETS.arbitrum} />
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
