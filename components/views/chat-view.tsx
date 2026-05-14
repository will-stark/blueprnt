'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { ChatBox } from '@/components/chat/chat-box'
import { PromptTips } from '@/components/chat/prompt-tips'
import { UserMessage, AIMessage, ZeroEditsMessage } from '@/components/chat/message'
import { Logo } from '@/components/ui/logo'
import { ZeroCreditsSlideUp } from '@/components/modals/continue-chat-slideup'
import { ContinueChatRegistered, ContinueChatAnon } from '@/components/modals/continue-chat-slideup'
import { AccountPromptModal } from '@/components/modals/confirm-modals'
import type { MockUser, MockMessage } from '@/lib/mock-data'
import { MOCK_AI_RESPONSES } from '@/lib/mock-data'

interface ChatViewProps {
  user: MockUser
  credits: number
  edits: number
  messages: MockMessage[]
  onMessagesChange: (messages: MockMessage[] | ((prev: MockMessage[]) => MockMessage[])) => void
  onInputChange: (v: string) => void
  inputValue: string
  onOpenPurchase: () => void
  anonymousAllowed?: boolean
  onLogin?: () => void
  onGenerate?: () => void
  isMobile?: boolean
}

type ActiveSlideUp = 'none' | 'zero_credits' | 'zero_edits' | 'anon_limit' | 'account_prompt'

export function ChatView({
  user,
  credits,
  edits,
  messages,
  onMessagesChange,
  onInputChange,
  inputValue,
  onOpenPurchase,
  anonymousAllowed = true,
  onLogin,
  onGenerate,
  isMobile = false,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [slideUp, setSlideUp] = useState<ActiveSlideUp>('none')
  const editsRef = useRef(edits)
  const creditsRef = useRef(credits)
  editsRef.current = edits
  creditsRef.current = credits

  const hasMessages = messages.length > 0
  const aiTurnCount = messages.filter((m) => m.role === 'assistant').length
  const zeroEdits = edits === 0 && hasMessages
  const isFarcaster = user.type === 'farcaster'
  const isAnonymous = user.type === 'anonymous'

  // Scroll to bottom on new message / stream update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const mockStream = useCallback(
    (text: string, onDone: () => void) => {
      setStreamingContent('')
      setIsStreaming(true)
      let i = 0
      const interval = setInterval(() => {
        i += 3
        setStreamingContent(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setIsStreaming(false)
          setStreamingContent('')
          onDone()
        }
      }, 16)
      return interval
    },
    []
  )

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return

    // Anonymous checks come first — different slide-ups than registered users
    if (isAnonymous) {
      if (!anonymousAllowed) {
        setSlideUp('account_prompt')
        return
      }
      if (creditsRef.current === 0 || hasMessages) {
        setSlideUp('anon_limit')
        return
      }
    }

    // Registered users: zero credits
    if (creditsRef.current === 0) {
      setSlideUp('zero_credits')
      return
    }

    // Zero edits check (for follow-up messages)
    if (hasMessages && editsRef.current === 0) {
      setSlideUp('zero_edits')
      return
    }

    const userMsg: MockMessage = { id: Date.now().toString(), role: 'user', content: inputValue }
    onMessagesChange([...messages, userMsg])
    onInputChange('')

    // Pick a mock AI response
    const aiText = MOCK_AI_RESPONSES[aiTurnCount % MOCK_AI_RESPONSES.length]
    const isFirstGen = !hasMessages

    mockStream(aiText, () => {
      const assistantMsg: MockMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
      }
      onMessagesChange((prev: MockMessage[]) => [...prev, assistantMsg])
      if (isFirstGen) onGenerate?.()
    })
  }, [inputValue, isStreaming, hasMessages, isAnonymous, anonymousAllowed, messages, aiTurnCount, mockStream, onMessagesChange, onInputChange, onGenerate])

  const handleRegenerate = useCallback(() => {
    const lastAI = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAI) return
    const aiText = MOCK_AI_RESPONSES[(aiTurnCount + 1) % MOCK_AI_RESPONSES.length]
    mockStream(aiText, () => {
      const updated = messages.map((m) =>
        m.id === lastAI.id ? { ...m, content: aiText } : m
      )
      onMessagesChange(updated)
    })
  }, [messages, aiTurnCount, mockStream, onMessagesChange])

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-4">
        {!hasMessages && !isStreaming ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full gap-6 max-w-xl mx-auto">
            <Logo size="large" />
            <h1
              className="text-[32px] font-medium text-center text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              What will you build?
            </h1>
            <PromptTips onSelectTip={onInputChange} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <UserMessage key={msg.id} content={msg.content} />
              ) : (
                <AIMessage key={msg.id} content={msg.content} onRegenerate={handleRegenerate} />
              )
            )}

            {/* Streaming AI message */}
            {isStreaming && streamingContent && (
              <AIMessage content={streamingContent} isStreaming />
            )}

            {/* Zero edits nudge */}
            {zeroEdits && !isStreaming && <ZeroEditsMessage />}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-4 md:px-8 pt-4 border-t-[0.5px] border-[var(--border)]"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          paddingBottom: isMobile
            ? 'max(1rem, env(safe-area-inset-bottom))'
            : '1rem',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <ChatBox
            value={inputValue}
            onChange={onInputChange}
            onSend={handleSend}
            isStreaming={isStreaming}
            disabled={zeroEdits}
            placeholder={
              hasMessages
                ? 'Follow up or refine your blueprint...'
                : undefined
            }
          />
        </div>
      </div>

      {/* SlideUps */}
      {slideUp === 'zero_credits' && (
        <ZeroCreditsSlideUp
          onClose={() => setSlideUp('none')}
          onPurchase={() => { onOpenPurchase(); setSlideUp('none') }}
          isFarcaster={isFarcaster}
        />
      )}
      {slideUp === 'zero_edits' && (
        <ContinueChatRegistered
          onClose={() => setSlideUp('none')}
          onPurchase={() => { onOpenPurchase(); setSlideUp('none') }}
        />
      )}
      {slideUp === 'anon_limit' && (
        <ContinueChatAnon
          onClose={() => setSlideUp('none')}
          onCreateAccount={() => setSlideUp('account_prompt')}
        />
      )}
      {slideUp === 'account_prompt' && (
        <AccountPromptModal onClose={() => setSlideUp('none')} onLogin={onLogin} />
      )}
    </div>
  )
}
