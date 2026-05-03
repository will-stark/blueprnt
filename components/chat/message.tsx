'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, RefreshCw, Check } from 'lucide-react'

interface UserMessageProps {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-6">
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-md text-[14px] leading-relaxed"
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
  onCopy?: () => void
  onRegenerate?: () => void
}

export function AIMessage({ content, isStreaming = false, onCopy, onRegenerate }: AIMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {
      // execCommand fallback
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
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {/* Action buttons — only after streaming completes */}
        {!isStreaming && content && (
          <div className="flex gap-2 mt-4 pt-3 border-t-[0.5px] border-[var(--border)]">
            <button
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy blueprint'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)] active:scale-95 border-[0.5px] border-[var(--border)]"
              style={{ color: 'var(--text-muted)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={onRegenerate}
              aria-label="Regenerate blueprint"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)] active:scale-95 border-[0.5px] border-[var(--border)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
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
