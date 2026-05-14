'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { SHARE_CAST_TEXT, buildCastComposerUrl } from '@/lib/share'

type ShareState =
  | 'initial'
  | 'verifying'
  | 'round1_fail'
  | 'round2_verifying'
  | 'round2_fail'
  | 'success'
  | 'service_unavailable'

interface ShareVerificationModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function ShareVerificationModal({ onClose, onSuccess }: ShareVerificationModalProps) {
  const [state, setState] = useState<ShareState>('initial')

  const openCastComposer = () => {
    window.open(buildCastComposerUrl(), '_blank', 'noopener,noreferrer')
  }

  const handleShareClick = () => {
    openCastComposer()
    setState('verifying')
  }

  const handleRetry = () => {
    openCastComposer()
    setState('round2_verifying')
    // Simulate round 2 verification (mock — real polling via Neynar in API route)
    setTimeout(() => setState('round2_fail'), 4000)
  }

  const handleSimulateSuccess = () => {
    setState('success')
    onSuccess?.()
  }

  // Simulate round 1 verification result (real: poll /api/share/verify)
  if (state === 'verifying') {
    // Auto-advance in demo — real app would poll Neynar
    // Left as interactive so the demo switcher can trigger both outcomes.
  }

  return (
    <Modal title="Share to unlock credits" onClose={onClose}>
      <div className="p-6 space-y-5">

        {/* INITIAL — show cast text + share button */}
        {state === 'initial' && (
          <>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Share this message on Farcaster to receive 2 credits:
            </p>

            {/* Cast preview */}
            <div
              className="px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)] text-[13px] leading-relaxed"
              style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)' }}
            >
              &ldquo;{SHARE_CAST_TEXT}&rdquo;
            </div>

            {/* Requirements hint */}
            <div
              className="flex gap-2.5 px-3 py-2.5 rounded-lg border-[0.5px] border-[var(--border)]"
              style={{ backgroundColor: 'var(--bg-raised)' }}
            >
              <span className="text-[13px] shrink-0" style={{ color: 'var(--text-muted)' }}>ⓘ</span>
              <div className="text-[12px] space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                <p>To ensure verification, include:</p>
                <p>• The text above</p>
                <p>• The mini-app URL</p>
              </div>
            </div>

            <button
              onClick={handleShareClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Share to Farcaster
            </button>
          </>
        )}

        {/* VERIFYING */}
        {state === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              Verifying cast...
            </p>
            {/* Demo controls — remove before launch */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSimulateSuccess}
                className="text-[11px] px-3 py-1 rounded-lg border-[0.5px] border-[var(--border)] hover:bg-[var(--bg-raised)]"
                style={{ color: 'var(--text-faint)' }}
              >
                Demo: success
              </button>
              <button
                onClick={() => setState('round1_fail')}
                className="text-[11px] px-3 py-1 rounded-lg border-[0.5px] border-[var(--border)] hover:bg-[var(--bg-raised)]"
                style={{ color: 'var(--text-faint)' }}
              >
                Demo: fail
              </button>
            </div>
          </div>
        )}

        {/* ROUND 1 FAIL */}
        {state === 'round1_fail' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                {"Couldn't verify your cast."}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Share to Farcaster
            </button>
          </div>
        )}

        {/* ROUND 2 VERIFYING */}
        {state === 'round2_verifying' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              Verifying cast...
            </p>
          </div>
        )}

        {/* ROUND 2 FAIL */}
        {state === 'round2_fail' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                {"Still couldn't verify your cast."}
              </p>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Please try again later.
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

        {/* SUCCESS */}
        {state === 'success' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
              <div>
                <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  Cast verified
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  2 credits have been added to your balance.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Done
            </button>
          </div>
        )}

        {/* SERVICE UNAVAILABLE */}
        {state === 'service_unavailable' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  Verification unavailable
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Verification service is experiencing issues. Please try again in a few minutes.
                </p>
              </div>
            </div>
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
