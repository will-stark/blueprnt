'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

type VerifyState = 'verifying' | 'round1_fail' | 'round2_verifying' | 'round2_fail'

interface ShareVerificationModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function ShareVerificationModal({ onClose, onSuccess }: ShareVerificationModalProps) {
  const [state, setState] = useState<VerifyState>('verifying')

  // Simulate verification flow for demo
  const handleTryAgain = () => {
    setState('round2_verifying')
    setTimeout(() => setState('round2_fail'), 3000)
  }

  return (
    <Modal title="Share to unlock credits" onClose={onClose}>
      <div className="p-6 space-y-5">
        {state === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <div className="text-center">
              <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Verifying your cast...
              </p>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                This can take up to 30 seconds
              </p>
            </div>
            {/* Demo: trigger round 1 fail after a moment */}
            <button
              onClick={() => setState('round1_fail')}
              className="text-[12px] underline mt-2"
              style={{ color: 'var(--text-faint)' }}
            >
              (Demo: simulate fail)
            </button>
          </div>
        )}

        {state === 'round1_fail' && (
          <div className="space-y-4">
            <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
              {"We couldn't verify your cast. Try again?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-colors hover:bg-[var(--bg-raised)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Close
              </button>
              <button
                onClick={handleTryAgain}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {state === 'round2_verifying' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <div className="text-center">
              <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Checking again...
              </p>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                One more round of verification
              </p>
            </div>
          </div>
        )}

        {state === 'round2_fail' && (
          <div className="space-y-4">
            <div
              className="px-4 py-3 rounded-xl border-[0.5px] border-[var(--danger)]"
              style={{ backgroundColor: 'var(--danger-light)' }}
            >
              <p className="text-[13px]" style={{ color: 'var(--danger)' }}>
                {"Unfortunately we couldn't verify your cast. Try again later."}
              </p>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              If you genuinely shared, your credits will be added manually within 24 hours.
            </p>
            <p className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Cooldown: 59m remaining
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-colors hover:bg-[var(--bg-raised)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
