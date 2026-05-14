/**
 * One-shot migration: encrypt all plaintext chat titles and message content.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/encrypt-existing-data.ts
 *
 * Safe to run multiple times — already-encrypted rows are skipped.
 * Requires ENCRYPTION_KEY env var (same value used in production).
 */

import { db } from '../lib/db'
import { chats, messages } from '../lib/db/schema'
import { encrypt, isEncrypted } from '../lib/crypto'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('[ENCRYPT-MIGRATION] Starting…')

  // ── Chat titles ────────────────────────────────────────────────────────
  const allChats = await db.select().from(chats)
  let chatEncrypted = 0
  let chatSkipped = 0

  for (const chat of allChats) {
    if (isEncrypted(chat.title)) {
      chatSkipped++
      continue
    }
    await db.update(chats).set({ title: encrypt(chat.title) }).where(eq(chats.id, chat.id))
    chatEncrypted++
  }

  console.log('[ENCRYPT-MIGRATION] Chats: %d encrypted, %d already done (total %d)',
    chatEncrypted, chatSkipped, allChats.length)

  // ── Message content ────────────────────────────────────────────────────
  const allMessages = await db.select().from(messages)
  let msgEncrypted = 0
  let msgSkipped = 0

  for (const msg of allMessages) {
    const updates: Record<string, unknown> = {}

    if (!isEncrypted(msg.content)) {
      updates.content = encrypt(msg.content)
    }

    const branches = msg.branches as Array<{ content: string; timestamp: string }> | null
    if (branches && branches.length > 0) {
      const hasPlainBranch = branches.some((b) => !isEncrypted(b.content))
      if (hasPlainBranch) {
        updates.branches = branches.map((b) => ({
          ...b,
          content: isEncrypted(b.content) ? b.content : encrypt(b.content),
        }))
      }
    }

    if (Object.keys(updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.update(messages).set(updates as any).where(eq(messages.id, msg.id))
      msgEncrypted++
    } else {
      msgSkipped++
    }
  }

  console.log('[ENCRYPT-MIGRATION] Messages: %d encrypted, %d already done (total %d)',
    msgEncrypted, msgSkipped, allMessages.length)

  console.log('[ENCRYPT-MIGRATION] Done.')
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('[ENCRYPT-MIGRATION] Fatal:', err)
  process.exit(1)
})
