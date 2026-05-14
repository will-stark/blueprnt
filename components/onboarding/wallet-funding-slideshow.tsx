'use client'

import { useState } from 'react'
import { Copy, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { WALLET_SLIDES } from '@/lib/mock-data'

interface WalletFundingSlideshowProps {
  onDismiss: () => void
}

function WalletVisual({ visual, address }: { visual: string; address?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (address) navigator.clipboard.writeText(address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (visual === 'wallet' && address) {
    return (
      <div
        className="w-full max-w-xs px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)] flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--bg-raised)' }}
      >
        <span className="font-mono text-[12px] truncate" style={{ color: 'var(--text-primary)' }}>
          {address}
        </span>
        <button
          onClick={handleCopy}
          aria-label="Copy wallet address"
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-[var(--bg-muted)]"
          style={{ color: 'var(--accent)' }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    )
  }

  const icons: Record<string, string> = { usdc: '💵', gas: '⛽' }
  return (
    <div
      className="flex items-center justify-center w-16 h-16 rounded-3xl border-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-raised)' }}
    >
      <span className="text-3xl" role="img" aria-label={visual}>{icons[visual] ?? '💳'}</span>
    </div>
  )
}

export function WalletFundingSlideshow({ onDismiss }: WalletFundingSlideshowProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const slide = WALLET_SLIDES[slideIndex]
  const isLast = slideIndex === WALLET_SLIDES.length - 1
  const isFirst = slideIndex === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="relative w-full bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-3xl p-8 md:p-12 flex flex-col items-center text-center gap-6 animate-[modalIn_250ms_ease-out]"
        style={{
          maxWidth: 560,
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Skip */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </button>

        {/* Progress dots */}
        <div className="flex gap-2 self-start">
          {WALLET_SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === slideIndex ? 24 : 6,
                backgroundColor: i === slideIndex ? 'var(--accent)' : 'var(--bg-raised)',
              }}
            />
          ))}
        </div>

        {/* Visual */}
        <div className="my-4">
          <WalletVisual
            visual={slide.visual}
            address={'mockAddress' in slide ? (slide as typeof slide & { mockAddress: string }).mockAddress : undefined}
          />
        </div>

        {/* Title */}
        <h1
          className="text-[24px] font-medium leading-tight text-balance"
          style={{ color: 'var(--text-primary)' }}
        >
          {slide.title}
        </h1>

        {/* Body */}
        <p className="text-[14px] leading-relaxed max-w-sm text-pretty" style={{ color: 'var(--text-secondary)' }}>
          {slide.body}
        </p>

        {/* Navigation */}
        <div className="w-full flex items-center justify-between mt-2">
          <button
            onClick={() => setSlideIndex((i) => i - 1)}
            disabled={isFirst}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-[0.5px] border-[var(--border)] transition-all hover:bg-[var(--bg-raised)] disabled:opacity-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {isLast ? (
            <button
              onClick={onDismiss}
              className="flex-1 mx-4 py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Go to app
            </button>
          ) : (
            <button
              onClick={() => setSlideIndex((i) => i + 1)}
              className="flex-1 mx-4 py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Next
            </button>
          )}

          <button
            onClick={() => setSlideIndex((i) => i + 1)}
            disabled={isLast}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-[0.5px] border-[var(--border)] transition-all hover:bg-[var(--bg-raised)] disabled:opacity-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
