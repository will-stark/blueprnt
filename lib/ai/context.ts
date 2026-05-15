import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { decrypt } from '@/lib/crypto'
import { eq, and } from 'drizzle-orm'
import type { BlueprintContext } from './types'

interface LoadContextOptions {
  chatId: string
  // Which AI message the user is currently viewing (for regenerate branching)
  activeBlueprintMessageId?: string
  activeBranchIndex?: number
}

export async function loadBlueprintContext(opts: LoadContextOptions): Promise<BlueprintContext> {
  const { chatId, activeBlueprintMessageId, activeBranchIndex } = opts

  // Fetch the two most recent messages: the active AI blueprint and the user message before it
  const rows = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      branches: messages.branches,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt)

  if (rows.length === 0) {
    return { currentBlueprint: null, originalUserMessage: null }
  }

  // Find the AI message to use as blueprint context
  let aiMessage: (typeof rows)[0] | undefined

  if (activeBlueprintMessageId) {
    aiMessage = rows.find((r) => r.id === activeBlueprintMessageId && r.role === 'assistant')
  }

  // Fallback: last assistant message
  if (!aiMessage) {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].role === 'assistant') {
        aiMessage = rows[i]
        break
      }
    }
  }

  if (!aiMessage) {
    return { currentBlueprint: null, originalUserMessage: null }
  }

  // Determine blueprint text — branch takes priority over main content
  let blueprintRaw: string = aiMessage.content ?? ''

  if (
    typeof activeBranchIndex === 'number' &&
    activeBranchIndex > 0 &&
    Array.isArray(aiMessage.branches)
  ) {
    const branchIdx = activeBranchIndex - 1 // branch 0 = main content, branches array is 1-based offset
    const branch = (aiMessage.branches as Array<{ content: string }>)[branchIdx]
    if (branch?.content) {
      blueprintRaw = branch.content
    }
  }

  const currentBlueprint = decrypt(blueprintRaw)

  // Find the user message that preceded this AI message
  const aiIdx = rows.findIndex((r) => r.id === aiMessage!.id)
  let originalUserMessage: string | null = null

  for (let i = aiIdx - 1; i >= 0; i--) {
    if (rows[i].role === 'user') {
      originalUserMessage = decrypt(rows[i].content ?? '')
      break
    }
  }

  return { currentBlueprint, originalUserMessage }
}
