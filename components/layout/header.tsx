'use client'

import { Menu, Gift, HelpCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Pill } from '@/components/ui/pill'
import { UserPFP } from '@/components/ui/user-pfp'
import type { MockUser } from '@/lib/mock-data'

interface HeaderProps {
  user: MockUser
  credits: number
  edits?: number
  hasFirstMessage?: boolean
  onOpenSidebar: () => void
  onOpenPurchase: () => void
  onOpenTicket: () => void
  onOpenShare?: () => void
}

export function Header({
  user,
  credits,
  edits,
  hasFirstMessage = false,
  onOpenSidebar,
  onOpenPurchase,
  onOpenTicket,
  onOpenShare,
}: HeaderProps) {
  const isRegistered = user.type !== 'anonymous'
  const isFarcaster = user.type === 'farcaster'
  const creditsZero = credits === 0
  const editsZero = (edits ?? 1) === 0

  return (
    <header
      className="sticky top-0 z-10 h-14 flex items-center justify-between px-4 border-b-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Left: hamburger (mobile only) + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo size="header" />
      </div>

      {/* Right: pills + icons + PFP */}
      <div className="flex items-center gap-1.5">
        {/* Credits pill — always visible for registered */}
        {isRegistered && (
          <button
            onClick={creditsZero ? onOpenPurchase : undefined}
            className={creditsZero ? 'cursor-pointer' : 'cursor-default'}
          >
            <Pill
              value={credits}
              label="credits"
              timerText={creditsZero ? 'New in 23h 12m' : undefined}
            />
          </button>
        )}

        {/* Edits pill — visible after first message */}
        {isRegistered && hasFirstMessage && edits !== undefined && (
          <Pill
            value={edits}
            label="edits"
            timerText={editsZero ? 'New in 11h 43m' : undefined}
          />
        )}

        {/* Gift icon — Farcaster only */}
        {isFarcaster && onOpenShare && (
          <button
            onClick={onOpenShare}
            aria-label="Share to unlock 2 credits"
            title="Share to unlock 2 credits"
            className="w-8 h-8 flex items-center justify-center rounded-lg border-[0.5px] border-[var(--border)] transition-all duration-200 hover:bg-[var(--bg-raised)] hover:border-[var(--border-strong)] active:scale-95"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
          >
            <Gift className="w-4 h-4" />
          </button>
        )}

        {/* Question mark — registered only */}
        {isRegistered && (
          <button
            onClick={onOpenTicket}
            aria-label="Submit a ticket"
            title="Submit a ticket"
            className="w-8 h-8 flex items-center justify-center rounded-lg border-[0.5px] border-[var(--border)] transition-all duration-200 hover:bg-[var(--bg-raised)] hover:border-[var(--border-strong)] active:scale-95"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* PFP */}
        <UserPFP user={user} size={28} />
      </div>
    </header>
  )
}
