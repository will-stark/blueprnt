'use client'

import { SlideUp } from '@/components/ui/slide-up'

// Registered user: purchase edits or wait
interface ContinueChatRegisteredProps {
  onClose: () => void
  onPurchase: () => void
}

export function ContinueChatRegistered({ onClose, onPurchase }: ContinueChatRegisteredProps) {
  return (
    <SlideUp onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-[16px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Out of edits
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {"You've used all your edits in this chat. Purchase more to continue, or wait for your free edits."}
          </p>
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-raised)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Free edits return in</span>
          <span className="font-mono text-[13px]" style={{ color: 'var(--text-primary)' }}>11h 43m</span>
        </div>

        <button
          onClick={() => { onPurchase(); onClose() }}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Purchase 10 edits — $0.25
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-[13px] font-medium transition-colors hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          Wait for free edits
        </button>
      </div>
    </SlideUp>
  )
}

// Anonymous user: sign in to generate
interface ContinueChatAnonProps {
  onClose: () => void
  onLogin: () => void
}

export function ContinueChatAnon({ onClose, onLogin }: ContinueChatAnonProps) {
  return (
    <SlideUp onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-[16px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Log in to generate your blueprint
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Create a free account to get 3 blueprints, save your chats, and pick up where you left off.
          </p>
        </div>

        <button
          onClick={() => { onLogin(); onClose() }}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Log in / Sign up
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-[13px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Not now
        </button>
      </div>
    </SlideUp>
  )
}

// Zero credits slide-up (registered)
interface ZeroCreditsSlideUpProps {
  onClose: () => void
  onPurchase: () => void
  onShare?: () => void
  isFarcaster?: boolean
}

export function ZeroCreditsSlideUp({
  onClose,
  onPurchase,
  onShare,
  isFarcaster = false,
}: ZeroCreditsSlideUpProps) {
  return (
    <SlideUp onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-[16px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {"You're out of credits"}
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {"You've exhausted your credits. Wait for free credits or purchase more."}
          </p>
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)]"
          style={{ backgroundColor: 'var(--bg-raised)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Free credit returns in</span>
          <span className="font-mono text-[13px]" style={{ color: 'var(--text-primary)' }}>23h 12m</span>
        </div>

        <button
          onClick={() => { onPurchase(); onClose() }}
          className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Purchase credits
        </button>

        {isFarcaster && onShare && (
          <button
            onClick={() => { onShare(); onClose() }}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium border-[0.5px] border-[var(--border)] transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Share to unlock 2 credits
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 text-[13px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Wait for free credits
        </button>
      </div>
    </SlideUp>
  )
}
