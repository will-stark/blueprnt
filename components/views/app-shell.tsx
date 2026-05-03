'use client'

import { useState, useCallback, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ChatView } from '@/components/views/chat-view'
import { AdminView } from '@/components/views/admin-view'
import { PurchaseModal } from '@/components/modals/purchase-modal'
import { TipModal, SupportPopup } from '@/components/modals/tip-modal'
import { TicketModal } from '@/components/modals/ticket-modal'
import { ShareVerificationModal } from '@/components/modals/share-verification-modal'
import {
  ClearAllModal,
  DeleteChatModal,
  RenameChatModal,
  NewChatWarningModal,
} from '@/components/modals/confirm-modals'
import { OnboardingSlideshow } from '@/components/onboarding/onboarding-slideshow'
import { WalletFundingSlideshow } from '@/components/onboarding/wallet-funding-slideshow'
import { SplashScreen } from '@/components/ui/splash-screen'
import {
  MOCK_USER_FARCASTER,
  MOCK_USER_PRIVY,
  MOCK_USER_ANON,
  MOCK_CHATS,
  type MockChat,
  type MockUser,
  type MockMessage,
} from '@/lib/mock-data'

type ActiveModal =
  | 'none'
  | 'purchase'
  | 'tip'
  | 'ticket'
  | 'share'
  | 'clear_all'
  | 'delete_chat'
  | 'rename_chat'
  | 'new_chat_warn'
  | 'onboarding'
  | 'wallet_funding'

const USER_OPTIONS: { label: string; user: MockUser }[] = [
  { label: 'Farcaster', user: MOCK_USER_FARCASTER },
  { label: 'Privy', user: MOCK_USER_PRIVY },
  { label: 'Anonymous', user: MOCK_USER_ANON },
]

interface AppShellProps {
  // When provided, the sidebar will pre-select this chat on first render.
  // Claude Code will replace this with a real data-fetch.
  initialChatId?: string
  // When true, the 2.5s splash screen is skipped (e.g. on /chat/[id] deep links)
  skipSplash?: boolean
}

export function AppShell({ initialChatId, skipSplash = false }: AppShellProps) {
  const [userIndex, setUserIndex] = useState(0)
  const user = USER_OPTIONS[userIndex].user
  const [showSplash, setShowSplash] = useState(!skipSplash)
  const [chats, setChats] = useState<MockChat[]>(MOCK_CHATS)
  const [activeChatId, setActiveChatId] = useState<string>(
    initialChatId ?? MOCK_CHATS[0]?.id ?? ''
  )
  const [messages, setMessages] = useState<MockMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [credits, setCredits] = useState(user.credits)
  const [edits, setEdits] = useState(user.edits)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ActiveModal>('none')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    if (skipSplash) return
    const t = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(t)
  }, [skipSplash])

  const close = () => setActiveModal('none')

  const handleNewChat = useCallback(() => {
    if (messages.length > 0 && user.type === 'anonymous') {
      setActiveModal('new_chat_warn')
      return
    }
    const id = `chat_${Date.now()}`
    const newChat: MockChat = { id, title: 'New chat', updatedAt: new Date().toISOString(), editsRemaining: 10 }
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(id)
    setMessages([])
    setInputValue('')
    setShowAdmin(false)
  }, [messages.length, user.type])

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id)
    setMessages([])
    setShowAdmin(false)
    setSidebarOpen(false)
  }, [])

  const handleRenameChat = useCallback((id: string) => {
    setPendingRenameId(id)
    setActiveModal('rename_chat')
  }, [])

  const handleConfirmRename = useCallback((newTitle: string) => {
    if (!pendingRenameId) return
    setChats((prev) => prev.map((c) => (c.id === pendingRenameId ? { ...c, title: newTitle } : c)))
    setPendingRenameId(null)
  }, [pendingRenameId])

  const handleDeleteChat = useCallback((id: string) => {
    setPendingDeleteId(id)
    setActiveModal('delete_chat')
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteId) return
    setChats((prev) => prev.filter((c) => c.id !== pendingDeleteId))
    if (activeChatId === pendingDeleteId) {
      const remaining = chats.filter((c) => c.id !== pendingDeleteId)
      setActiveChatId(remaining[0]?.id ?? '')
      setMessages([])
    }
    setPendingDeleteId(null)
  }, [pendingDeleteId, activeChatId, chats])

  const handleClearAll = useCallback(() => {
    setChats([])
    setActiveChatId('')
    setMessages([])
  }, [])

  const pendingChat = chats.find((c) => c.id === pendingDeleteId)
  const pendingRenameChat = chats.find((c) => c.id === pendingRenameId)

  if (showSplash) return <SplashScreen />

  return (
    <div
      className="flex h-screen overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Demo mode user-switcher — remove before launch */}
      <div className="fixed bottom-4 right-4 z-[60] flex gap-1 p-1.5 rounded-2xl border-[0.5px] border-[var(--border)]" style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
        <span className="px-2 py-1 text-[10px] self-center" style={{ color: 'var(--text-muted)' }}>Demo:</span>
        {USER_OPTIONS.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => { setUserIndex(i); setCredits(opt.user.credits); setEdits(opt.user.edits) }}
            className="px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-150"
            style={{
              backgroundColor: userIndex === i ? 'var(--accent)' : 'transparent',
              color: userIndex === i ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px self-stretch" style={{ backgroundColor: 'var(--border)' }} />
        <button
          onClick={() => setActiveModal('onboarding')}
          className="px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-150 hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Onboarding
        </button>
        <button
          onClick={() => setActiveModal('wallet_funding')}
          className="px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-150 hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Wallet slides
        </button>
      </div>

      <Sidebar
        user={user}
        chats={chats}
        activeChatId={activeChatId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onClearAll={() => setActiveModal('clear_all')}
        onOpenPurchase={() => setActiveModal('purchase')}
        onOpenSupport={() => setActiveModal('tip')}
        onOpenShare={() => setActiveModal('share')}
        onOpenAdmin={() => { setShowAdmin(true); setSidebarOpen(false) }}
        chatMenuOpenId={chatMenuOpenId}
        onToggleChatMenu={setChatMenuOpenId}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          user={user}
          credits={credits}
          edits={edits}
          hasFirstMessage={messages.length > 0}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenPurchase={() => setActiveModal('purchase')}
          onOpenTicket={() => setActiveModal('ticket')}
          onOpenShare={() => setActiveModal('share')}
        />

        {showAdmin ? (
          <AdminView />
        ) : (
          <ChatView
            user={user}
            credits={credits}
            edits={edits}
            messages={messages}
            onMessagesChange={setMessages as (m: MockMessage[] | ((prev: MockMessage[]) => MockMessage[])) => void}
            onInputChange={setInputValue}
            inputValue={inputValue}
            onOpenPurchase={() => setActiveModal('purchase')}
          />
        )}
      </div>

      {activeModal === 'purchase' && (
        <PurchaseModal onClose={close} userType={user.type} />
      )}
      {activeModal === 'tip' && (
        user.type === 'anonymous'
          ? <SupportPopup onClose={close} />
          : <TipModal onClose={close} userType={user.type} />
      )}
      {activeModal === 'ticket' && <TicketModal onClose={close} />}
      {activeModal === 'share' && <ShareVerificationModal onClose={close} />}
      {activeModal === 'clear_all' && (
        <ClearAllModal onClose={close} onConfirm={handleClearAll} />
      )}
      {activeModal === 'delete_chat' && pendingChat && (
        <DeleteChatModal
          chatTitle={pendingChat.title}
          onClose={close}
          onConfirm={handleConfirmDelete}
        />
      )}
      {activeModal === 'rename_chat' && pendingRenameChat && (
        <RenameChatModal
          currentTitle={pendingRenameChat.title}
          onClose={close}
          onSave={handleConfirmRename}
        />
      )}
      {activeModal === 'new_chat_warn' && (
        <NewChatWarningModal
          onClose={close}
          onConfirm={() => {
            const id = `chat_${Date.now()}`
            setChats((prev) => [{ id, title: 'New chat', updatedAt: new Date().toISOString(), editsRemaining: 10 }, ...prev])
            setActiveChatId(id)
            setMessages([])
            setInputValue('')
          }}
        />
      )}
      {activeModal === 'onboarding' && (
        <OnboardingSlideshow userType={user.type} onDismiss={close} />
      )}
      {activeModal === 'wallet_funding' && (
        <WalletFundingSlideshow onDismiss={close} />
      )}
    </div>
  )
}
