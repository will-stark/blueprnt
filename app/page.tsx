'use client'

import { useState, useCallback } from 'react'
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
import {
  MOCK_USER_FARCASTER,
  MOCK_USER_PRIVY,
  MOCK_USER_ANON,
  MOCK_CHATS,
  type MockChat,
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

// Cycle through users for dev preview
const DEV_USER = MOCK_USER_FARCASTER

export default function HomePage() {
  const [user] = useState(DEV_USER)
  const [chats, setChats] = useState<MockChat[]>(MOCK_CHATS)
  const [activeChatId, setActiveChatId] = useState<string>(MOCK_CHATS[0]?.id ?? '')
  const [messages, setMessages] = useState<MockMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [credits, setCredits] = useState(user.credits ?? 3)
  const [edits, setEdits] = useState(user.edits ?? 5)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ActiveModal>('none')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const close = () => setActiveModal('none')

  // Chat actions
  const handleNewChat = useCallback(() => {
    if (messages.length > 0 && user.type === 'anonymous') {
      setActiveModal('new_chat_warn')
      return
    }
    const id = `chat_${Date.now()}`
    const newChat: MockChat = { id, title: 'New chat', updatedAt: new Date().toISOString() }
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(id)
    setMessages([])
    setInputValue('')
    setShowAdmin(false)
  }, [messages.length, user.type])

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id)
    setMessages([]) // In production this would load from DB
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

  return (
    <div
      className="flex h-screen overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Sidebar */}
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

      {/* Main column */}
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

      {/* Modals */}
      {activeModal === 'purchase' && (
        <PurchaseModal onClose={close} userType={user.type} />
      )}
      {activeModal === 'tip' && (
        user.type === 'anonymous'
          ? <SupportPopup onClose={close} />
          : <TipModal onClose={close} userType={user.type} />
      )}
      {activeModal === 'ticket' && (
        <TicketModal onClose={close} />
      )}
      {activeModal === 'share' && (
        <ShareVerificationModal onClose={close} />
      )}
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
            setChats((prev) => [{ id, title: 'New chat', updatedAt: new Date().toISOString() }, ...prev])
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
