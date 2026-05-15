'use client'

import { useState, useRef } from 'react'
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
  identityId?: string
}

const VERIFY_DELAY_MS = 5000

export function ShareVerificationModal({ onClose, onSuccess, identityId }: ShareVerificationModalProps) {
  const [state, setState] = useState<ShareState>('initial')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const callVerify = async (): Promise<void> => {
    if (!identityId) {
      setState('service_unavailable')
      return
    }
    try {
      const res = await fetch('/api/share/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityId }),
      })
      const data = await res.json()
      if (data.verified) {
        setState('success')
        onSuccess?.()
      } else if (data.reason === 'already_claimed') {
        setState('success')
        onSuccess?.()
      } else if (data.reason === 'not_farcaster_user') {
        setState('service_unavailable')
      } else {
        setState((prev) => (prev === 'round2_verifying' ? 'round2_fail' : 'round1_fail'))
      }
    } catch {
      setState('service_unavailable')
    }
  }

  const openCastComposer = () => {
    window.open(buildCastComposerUrl(), '_blank', 'noopener,noreferrer')
  }

  const handleShareClick = () => {
    openCastComposer()
    setState('verifying')
    timerRef.current = setTimeout(() => callVerify(), VERIFY_DELAY_MS)
  }

  const handleRetry = () => {
    openCastComposer()
    setState('round2_verifying')
    timerRef.current = setTimeout(() => callVerify(), VERIFY_DELAY_MS)
  }

  return (
    <Modal title="Share to unlock credits" onClose={onClose}>
      <div className="p-6 space-y-5">

        {/* INITIAL */}
        {state === 'initial' && (
          <>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Share this message on Farcaster to receive 2 credits:
            </p>
            <div
              className="px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)] text-[13px] leading-relaxed"
              style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)' }}
            >
              &ldquo;{SHARE_CAST_TEXT}&rdquo;
            </div>
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

        {/* VERIFYING (round 1 or 2) */}
        {(state === 'verifying' || state === 'round2_verifying') && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-[13px] md:text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              Verifying cast...
            </p>
          </div>
        )}

        {/* ROUND 1 FAIL */}
        {state === 'round1_fail' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <p className="text-[13px] md:text-[14px]" style={{ color: 'var(--text-primary)' }}>
                {"Couldn't verify your cast."}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {/* ROUND 2 FAIL */}
        {state === 'round2_fail' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <p className="text-[13px] md:text-[14px]" style={{ color: 'var(--text-primary)' }}>
                {"Still couldn't verify your cast."}
              </p>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Please try again later or contact support.
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
                <p className="text-[13px] md:text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
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
                <p className="text-[13px] md:text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  Verification unavailable
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  The verification service is experiencing issues. Please try again in a few minutes.
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
