import { PROMPT_TIPS } from '@/lib/mock-data'

export function PromptTips() {
  return (
    <div className="grid gap-2.5 max-w-xl mx-auto w-full">
      {PROMPT_TIPS.map((tip) => (
        <div
          key={tip}
          className="p-3 rounded-xl text-[13px] text-left border-[0.5px] border-[var(--border)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
          }}
        >
          {tip}
        </div>
      ))}
    </div>
  )
}
