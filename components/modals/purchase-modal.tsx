'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { CREDIT_OPTIONS } from '@/lib/mock-data'
import type { UserType } from '@/lib/mock-data'

interface PurchaseModalProps {
  onClose: () => void
  userType: UserType
}

// All payments on Base — no network selector needed.
const CHAIN_ID = 8453
const NETWORK_NAME = 'Base'

export function PurchaseModal({ onClose, userType }: PurchaseModalProps) {
  const [selected, setSelected] = useState<number | null>(null)

  // Suppress unused-var lint until wired to real payment logic
  void userType
  void CHAIN_ID

  return (
    <Modal title="Purchase credits" onClose={onClose}>
      <div className="p-6 space-y-5">
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

        {/* Credit options */}
        <div className="space-y-2">
          {CREDIT_OPTIONS.map((option) => (
            <button
              key={option.tier}
              onClick={() => setSelected(option.tier)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px] text-left transition-all duration-200 hover:border-[var(--border-strong)]"
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
                {selected === option.tier && (
                  <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          disabled={selected === null}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {selected === null ? 'Select an option' : `Purchase ${CREDIT_OPTIONS[selected].label.toLowerCase()}`}
        </button>

        <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
          A small amount of ETH is needed for gas. Payments are onchain and non-refundable.
        </p>
      </div>
    </Modal>
  )
}
