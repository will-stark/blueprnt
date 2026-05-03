// Per-chat URL — /chat/[id]
// Renders the full app shell with the specified chat pre-selected.
// TODO: Claude Code — replace mock pre-selection with real data fetch for params.id
import { AppShell } from '@/components/views/app-shell'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AppShell initialChatId={id} skipSplash />
}
