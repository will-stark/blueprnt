import { PROMPT_TIPS } from '@/lib/mock-data'

interface PromptTipsProps {
  onSelectTip: (tip: string) => void
}

export function PromptTips({ onSelectTip }: PromptTipsProps) {
  return (
    <div className="grid gap-2.5 max-w-xl mx-auto w-full">
      {PROMPT_TIPS.map((tip) => (
        <button
          key={tip}
          onClick={() => onSelectTip(tip)}
          className="p-3 rounded-xl text-[13px] text-left transition-all duration-200 border-[0.5px] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
          }}
        >
          {tip}
        </button>
      ))}
    </div>
  )
}
