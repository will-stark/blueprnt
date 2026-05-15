'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, RefreshCw, Check, ChevronLeft, ChevronRight } from 'lucide-react'

interface UserMessageProps {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-6">
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-md text-[13px] md:text-[14px] leading-relaxed"
        style={{
          backgroundColor: 'var(--accent-light)',
          color: 'var(--text-primary)',
        }}
      >
        {content}
      </div>
    </div>
  )
}

interface AIMessageProps {
  content: string
  isStreaming?: boolean
  isRegenerating?: boolean
  branchCount?: number
  activeBranchIndex?: number
  onBranchNav?: (direction: -1 | 1) => void
  onCopy?: () => void
  onRegenerate?: () => void
}

export function AIMessage({
  content,
  isStreaming = false,
  isRegenerating = false,
  branchCount,
  activeBranchIndex = 0,
  onBranchNav,
  onCopy,
  onRegenerate,
}: AIMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {
      const el = document.createElement('textarea')
      el.value = content
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  const showBranchNav = branchCount !== undefined && branchCount > 1

  return (
    <div className="flex justify-start mb-6">
      <div
        className="max-w-[90%] px-5 py-4 rounded-2xl rounded-tl-md border-[0.5px] border-[var(--border)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div
          className={`blueprnt-prose${isStreaming ? ' streaming-cursor' : ''}`}
          aria-live="polite"
          aria-atomic="false"
          style={{
            opacity: isRegenerating ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {/* Action buttons — only after streaming completes */}
        {!isStreaming && content && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t-[0.5px] border-[var(--border)]">
            <button
              onClick={handleCopy}
              disabled={isRegenerating}
              aria-label={copied ? 'Copied' : 'Copy blueprint'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)] active:scale-95 border-[0.5px] border-[var(--border)] disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            {/* Branch navigation */}
            {showBranchNav && (
              <div
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg border-[0.5px] border-[var(--border)] text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                <button
                  onClick={() => onBranchNav?.(-1)}
                  disabled={activeBranchIndex === 0 || isRegenerating}
                  aria-label="Previous version"
                  className="p-0.5 rounded transition-opacity disabled:opacity-30 hover:opacity-70"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="px-1 tabular-nums">
                  {activeBranchIndex + 1}/{branchCount}
                </span>
                <button
                  onClick={() => onBranchNav?.(1)}
                  disabled={activeBranchIndex === branchCount - 1 || isRegenerating}
                  aria-label="Next version"
                  className="p-0.5 rounded transition-opacity disabled:opacity-30 hover:opacity-70"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                aria-label={isRegenerating ? 'Regenerating…' : 'Regenerate blueprint'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)] active:scale-95 border-[0.5px] border-[var(--border)] disabled:opacity-60"
                style={{ color: 'var(--text-muted)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function AILoadingMessage({ showTakingLonger = false }: { showTakingLonger?: boolean }) {
  return (
    <div className="flex justify-start mb-6">
      <div
        className="px-5 py-4 rounded-2xl rounded-tl-md border-[0.5px] border-[var(--border)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {showTakingLonger ? (
          <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Taking a bit longer…
          </span>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--text-muted)', animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--text-muted)', animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: 'var(--text-muted)', animationDelay: '300ms' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Zero edits exhaustion message shown below last AI message
export function ZeroEditsMessage() {
  return (
    <div className="px-4 py-3 mb-4">
      <p className="text-[13px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {"You've used all your edits in this chat."}
      </p>
      <p className="font-mono text-[12px]" style={{ color: 'var(--text-muted)' }}>
        New edits in 11h 43m
      </p>
    </div>
  )
}
