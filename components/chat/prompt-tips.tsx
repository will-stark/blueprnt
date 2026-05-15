import { PROMPT_TIPS } from '@/lib/mock-data'

export function PromptTips() {
  return (
    <div className="grid gap-2 max-w-xl mx-auto w-full">
      {PROMPT_TIPS.map((tip) => (
        <div
          key={tip}
          className="px-3 py-2 md:p-3 rounded-xl text-[12px] md:text-[13px] text-left border-[0.5px] border-[var(--border)]"
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
