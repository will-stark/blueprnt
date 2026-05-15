'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { LogoMark } from '@/components/ui/logo'
import { ONBOARDING_SLIDES } from '@/lib/mock-data'
import { getSlide4Content, markOnboardingSeen } from '@/lib/onboarding'
import type { UserType } from '@/lib/mock-data'

interface OnboardingSlideshowProps {
  userType: UserType
  userId?: string
  onDismiss: () => void
}

function SlideVisual({ visual }: { visual: string }) {
  const base = 'flex items-center justify-center w-16 h-16 rounded-3xl border-[0.5px] border-[var(--border)]'
  const style = { backgroundColor: 'var(--bg-raised)' }

  if (visual === 'logo') {
    return <LogoMark size={48} />
  }

  const icons: Record<string, string> = {
    generate: '⚡',
    edit: '✏️',
    payment: '💳',
    terms: '📋',
    build: '🏗️',
  }

  return (
    <div className={base} style={style}>
      <span className="text-3xl" role="img" aria-label={visual}>{icons[visual] ?? '💳'}</span>
    </div>
  )
}

function TermsBox() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'
  return (
    <div
      className="relative w-full rounded-xl border-[0.5px] border-[var(--border)] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-raised)' }}
    >
      <div
        className="overflow-y-auto p-4 md:p-5 space-y-4 text-[13px] leading-relaxed text-left"
        style={{ maxHeight: 'min(240px, 38vh)', color: 'var(--text-secondary)' }}
      >
        <div>
          <p className="text-[13px] md:text-[15px]" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            Terms of Use — {appName}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Last Updated: May 2026</p>
        </div>

        <p>By using {appName}, you agree to these terms.</p>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>1. What {appName} Is</p>
          <p>
            {appName} generates AI-powered technical planning documents as a productivity tool.{' '}
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>This is NOT professional engineering advice.</span>{' '}
            You must review all output with qualified developers before implementation. We do not guarantee accuracy, completeness, or suitability for production use.
          </p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>2. Your Data</p>
          <p><span style={{ fontWeight: 500 }}>What we collect:</span> Farcaster users: FID, username, profile picture, wallet address. Privy users: email, login method, embedded wallet. All users: chat content, usage patterns, transaction data.</p>
          <p><span style={{ fontWeight: 500 }}>How we use it:</span> To provide the service, improve AI quality (anonymized), and prevent abuse.</p>
          <p><span style={{ fontWeight: 500 }}>What we don&apos;t do:</span> Sell your data or share your blueprints publicly without permission.</p>
          <p>Data stored in Neon (PostgreSQL) with row-level security. Not end-to-end encrypted. Backups retained 30 days.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>3. Payments</p>
          <p>All payments are onchain (Base network, USDC), final, and non-refundable. You pay gas fees. Credits don&apos;t expire but are non-transferable. We may change prices with 7 days notice.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>4. What You Can&apos;t Do</p>
          <p>Generate content that violates laws, reverse-engineer the AI, use for unauthorized commercial resale, submit others&apos; proprietary info without permission, or circumvent rate limits.</p>
          <p>Consequences: account suspension, credit forfeiture, legal action if warranted.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>5. Ownership</p>
          <p>You own the blueprints you generate. You can use, modify, or sell them commercially without attribution.</p>
          <p>AI output may resemble existing works. We don&apos;t warrant originality. You assume risk of IP claims from third parties.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>6. Our Liability</p>
          <p>
            <span style={{ fontWeight: 500 }}>Service provided &ldquo;AS IS.&rdquo;</span>{' '}
            We are not liable for errors in blueprints, losses from implementing generated plans, third-party failures, security breaches, or consequential damages.
          </p>
          <p>Maximum liability: the lesser of $50 USD or amount paid in the last 30 days. You agree to defend us against claims from your use of the service.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>7. Eligibility</p>
          <p>Must be 18+. Must comply with local laws regarding AI tools and cryptocurrency. Service unavailable in sanctioned countries.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>8. Disputes</p>
          <p>Governing law: Canada. Disputes resolved through binding arbitration, not court — except small claims. No class actions.</p>
        </div>

        <div className="space-y-1.5">
          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>9. Service Changes</p>
          <p>We may modify features, suspend service, or terminate accounts for violations. You may delete your account anytime (credits forfeited). You can export your data before deletion.</p>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-raised))' }}
      />
    </div>
  )
}

export function OnboardingSlideshow({ userType, userId, onDismiss }: OnboardingSlideshowProps) {
  const [slideIndex, setSlideIndex] = useState(0)

  const slide = ONBOARDING_SLIDES[slideIndex]
  const isLast = slideIndex === ONBOARDING_SLIDES.length - 1
  const isFirst = slideIndex === 0

  const body =
    slideIndex === 3
      ? getSlide4Content(userType)
      : (slide as typeof slide & { body: string }).body

  const handleDismiss = () => {
    markOnboardingSeen(userType, userId)
    onDismiss()
  }

  const goNext = () => {
    if (!isLast) setSlideIndex((i) => i + 1)
  }
  const goPrev = () => {
    if (!isFirst) setSlideIndex((i) => i - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="relative w-full bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-3xl p-6 md:p-12 flex flex-col items-center text-center gap-5 md:gap-6 animate-[modalIn_250ms_ease-out]"
        style={{
          maxWidth: 672,
          maxHeight: '90vh',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Skip button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </button>

        {/* Progress dots */}
        <div className="flex gap-2 self-start">
          {ONBOARDING_SLIDES.map((_, i) => (
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
          <SlideVisual visual={slide.visual} />
        </div>

        {/* Title */}
        <h1
          className="text-[22px] md:text-[28px] font-medium leading-tight text-balance"
          style={{ color: 'var(--text-primary)' }}
        >
          {slide.title}
        </h1>

        {/* Body */}
        {isLast ? (
          <TermsBox />
        ) : (
          <div
            className="text-[14px] md:text-[15px] leading-relaxed max-w-md text-pretty space-y-3 w-full"
            style={{ color: 'var(--text-secondary)' }}
          >
            {body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="w-full flex items-center justify-between mt-2">
          <button
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous slide"
            className="w-10 h-10 flex items-center justify-center rounded-xl border-[0.5px] border-[var(--border)] transition-all hover:bg-[var(--bg-raised)] disabled:opacity-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {isLast ? (
            <button
              onClick={handleDismiss}
              className="flex-1 mx-4 py-3 rounded-xl text-[13px] md:text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Get started
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex-1 mx-4 py-3 rounded-xl text-[13px] md:text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Next
            </button>
          )}

          <button
            onClick={goNext}
            disabled={isLast}
            aria-label="Next slide"
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
