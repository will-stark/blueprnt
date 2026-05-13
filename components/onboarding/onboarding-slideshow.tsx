'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { LogoMark } from '@/components/ui/logo'
import { ONBOARDING_SLIDES } from '@/lib/mock-data'
import { getSlide4Content, markOnboardingSeen } from '@/lib/onboarding'
import type { UserType } from '@/lib/mock-data'

interface OnboardingSlideshowProps {
  userType: UserType
  // userId is needed to persist seen-state per Farcaster FID or Privy ID.
  // Pass undefined for anonymous users.
  userId?: string
  onDismiss: () => void
}

function SlideVisual({ visual }: { visual: string }) {
  const base = 'flex items-center justify-center w-20 h-20 rounded-3xl border-[0.5px] border-[var(--border)]'
  const style = { backgroundColor: 'var(--bg-raised)' }

  if (visual === 'logo') {
    return <LogoMark size={64} />
  }

  const icons: Record<string, string> = {
    generate: '⚡',
    edit: '✏️',
    payment: '💳',
    terms: '📋',
  }

  return (
    <div className={base} style={style}>
      <span className="text-4xl" role="img" aria-label={visual}>{icons[visual]}</span>
    </div>
  )
}

export function OnboardingSlideshow({ userType, userId, onDismiss }: OnboardingSlideshowProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [showTerms, setShowTerms] = useState(false)
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'

  const slide = ONBOARDING_SLIDES[slideIndex]
  const isLast = slideIndex === ONBOARDING_SLIDES.length - 1
  const isFirst = slideIndex === 0

  // Slide 4 (index 3) shows user-type-specific pricing copy.
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
        className="relative w-full bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-3xl p-8 md:p-12 flex flex-col items-center text-center gap-6 animate-[modalIn_250ms_ease-out]"
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

        {showTerms ? (
          // Terms view
          <div className="w-full text-left space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>Terms of use</h2>
              <button
                onClick={() => setShowTerms(false)}
                aria-label="Back to slideshow"
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-raised)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>{appName} generates AI-powered technical blueprints for planning purposes only. Outputs are not professional engineering advice and should be reviewed by qualified developers before implementation.</p>
              <p>All payments made through {appName} are processed onchain via USDC on Base. Payments are non-refundable once transactions are confirmed onchain.</p>
              <p>Users are responsible for ensuring they have sufficient funds and for paying any applicable network gas fees. {appName} is not responsible for failed transactions due to insufficient gas or network congestion.</p>
              <p>By using {appName}, you agree to use the service only for lawful purposes and in accordance with these terms. The service may not be used to generate content that violates applicable laws or third-party rights.</p>
            </div>
          </div>
        ) : (
          <>
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
              className="text-[28px] md:text-[32px] font-medium leading-tight text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              {slide.title}
            </h1>

            {/* Body */}
            <p
              className="text-[15px] leading-relaxed max-w-md text-pretty"
              style={{ color: 'var(--text-secondary)' }}
            >
              {body}
              {isLast && (
                <>
                  {' '}
                  <button
                    onClick={() => setShowTerms(true)}
                    className="underline underline-offset-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--accent)' }}
                  >
                    View full terms
                  </button>
                </>
              )}
            </p>

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
                  className="flex-1 mx-4 py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Get started
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex-1 mx-4 py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
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
          </>
        )}
      </div>
    </div>
  )
}
