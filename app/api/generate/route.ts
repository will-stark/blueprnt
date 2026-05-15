import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, chats, messages } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { isAnonymousLimitHit, logAnonymousGeneration } from '@/lib/db/anonymous-limit'
import {
  getDailyGenerationCount,
  isUserRateLimited,
  hasPriorStrikeInWindow,
  logOffTopicStrike,
  logGeneration,
} from '@/lib/db/generation-log'
import { encrypt } from '@/lib/crypto'
import { hashForLogging } from '@/lib/logging'
import { classifyRequest, applyHardFilters, applyEditFilters } from '@/lib/ai/classify'
import { loadBlueprintContext } from '@/lib/ai/context'
import { buildPrompt } from '@/lib/ai/prompt-builder'
import { streamFromGemini } from '@/lib/ai/gemini'
import { validateBlueprint } from '@/lib/ai/validate'
import { alertDailyCapWarning } from '@/lib/alerts'
import type { GenerateRequestBody, PromptPayload } from '@/lib/ai/types'

export const maxDuration = 60

const GIFTED_CYCLE_DAYS = 7
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
}

const encoder = new TextEncoder()

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

function getDailyCap(): number {
  const cap = parseInt(process.env.DAILY_REQUEST_CAP ?? '1400', 10)
  return isNaN(cap) ? 1400 : cap
}

function buildStream(
  payload: PromptPayload,
  onComplete: (fullText: string) => Promise<Record<string, unknown> | void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      await streamFromGemini(payload, {
        onChunk: (text) => send(controller, { text }),
        onComplete: async (fullText) => {
          try {
            const meta = await onComplete(fullText)
            send(controller, { done: true, ...(meta ?? {}) })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error('[GENERATE] onComplete error:', msg)
            const clientMsg = msg === 'blueprint_invalid'
              ? 'Generation failed. Please try again.'
              : msg
            send(controller, { done: true, error: clientMsg })
          }
          controller.close()
        },
        onError: (err) => {
          console.error('[GENERATE] Stream error:', err.message)
          send(controller, { error: 'Generation failed. Please try again.' })
          controller.close()
        },
      })
    },
  })
  return new Response(stream, { headers: SSE_HEADERS })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const t0 = Date.now()

  let body: GenerateRequestBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    userType,
    message,
    isRegenerate,
    messageId,
    chatId,
    identityId,
    anonymousId,
    activeBlueprintMessageId,
    activeBranchIndex,
  } = body

  if (!userType || !message?.trim()) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // ── Daily global cap ───────────────────────────────────────────────────────
  const cap = getDailyCap()
  const dailyCount = await getDailyGenerationCount()
  if (dailyCount >= cap) {
    console.warn('[GENERATE] Daily cap hit: %d/%d', dailyCount, cap)
    return Response.json({ error: 'daily_cap_exceeded' }, { status: 429 })
  }

  // ── Anonymous path ─────────────────────────────────────────────────────────
  // Anonymous generation is currently paused. Remove the early return to re-enable.
  if (userType === 'anonymous') {
    return Response.json({ error: 'auth_required' }, { status: 401 })
  }
  if (userType === 'anonymous') {
    if (!anonymousId) return Response.json({ error: 'Missing anonymousId' }, { status: 400 })

    const filterError = applyHardFilters(message)
    if (filterError) return Response.json({ error: filterError }, { status: 400 })

    const limitHit = await isAnonymousLimitHit(anonymousId)
    if (limitHit) return Response.json({ error: 'no_credits' }, { status: 402 })

    const payload = buildPrompt(
      'new_blueprint',
      'generic',
      message,
      { currentBlueprint: null, originalUserMessage: null },
    )

    console.log('[GENERATE] Anon stream start. msgHash=%s', hashForLogging(message))
    return buildStream(payload, async (fullText) => {
      const validation = validateBlueprint(fullText)
      if (!validation.valid) throwBlueprintError(fullText, validation.reason ?? 'invalid')
      await logAnonymousGeneration(anonymousId)
      console.log('[GENERATE] Anon done. duration=%dms', Date.now() - t0)
    })
  }

  // ── Registered path ────────────────────────────────────────────────────────
  if (!identityId) return Response.json({ error: 'Missing identityId' }, { status: 400 })

  const rateLimited = await isUserRateLimited(identityId)
  if (rateLimited) return Response.json({ error: 'rate_limited' }, { status: 429 })

  const [user] = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
  if (!user) {
    console.warn('[GENERATE] User not found: identityId=%s', identityId.slice(0, 10) + '…')
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Classify — uses body to determine kind, prior strikes for two-strike logic
  const priorStrike = await hasPriorStrikeInWindow(identityId)
  const { kind, platform, isSecondStrike } = classifyRequest({ body, priorStrikeWithinWindow: priorStrike })

  // Off-topic two-strike handling
  if (kind === 'off_topic') {
    await logOffTopicStrike(identityId)
    const errorMsg = isSecondStrike
      ? 'This is not a general purpose chatbot. Kindly stick to describing an app idea.'
      : 'Blueprnt generates technical blueprints for app ideas. Please describe the app you want to build.'
    return Response.json({ error: errorMsg }, { status: 400 })
  }

  // Server-side char limits
  const filterError =
    kind === 'edit_blueprint' || kind === 'regenerate'
      ? applyEditFilters(message)
      : applyHardFilters(message)
  if (filterError) return Response.json({ error: filterError }, { status: 400 })

  // ── Regenerate ─────────────────────────────────────────────────────────────
  if (isRegenerate) {
    if (!messageId || !chatId) {
      return Response.json({ error: 'Missing messageId or chatId' }, { status: 400 })
    }

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (!chat) return Response.json({ error: 'Chat not found' }, { status: 404 })
    if (chat.userId !== user.id) return Response.json({ error: 'Unauthorized' }, { status: 403 })
    if (chat.editsRemaining <= 0) return Response.json({ error: 'no_edits' }, { status: 402 })

    const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1)
    if (!msg || msg.chatId !== chatId) {
      return Response.json({ error: 'Message not found' }, { status: 404 })
    }

    const context = await loadBlueprintContext({ chatId, activeBlueprintMessageId, activeBranchIndex })
    const payload = buildPrompt('regenerate', platform, message, context)

    console.log('[GENERATE] Regen stream start. chatId=%s msgHash=%s',
      chatId.slice(0, 8) + '…', hashForLogging(message))

    return buildStream(payload, async (fullText) => {
      const validation = validateBlueprint(fullText)
      if (!validation.valid) throwBlueprintError(fullText, validation.reason ?? 'invalid')

      const newBranch = [{ content: encrypt(fullText), timestamp: new Date().toISOString() }]
      await db
        .update(messages)
        .set({
          branches: sql`COALESCE(${messages.branches}, '[]'::jsonb) || ${JSON.stringify(newBranch)}::jsonb`,
        })
        .where(eq(messages.id, messageId))

      const [updatedChat] = await db
        .update(chats)
        .set({ editsRemaining: sql`GREATEST(${chats.editsRemaining} - 1, 0)`, updatedAt: new Date() })
        .where(eq(chats.id, chatId))
        .returning()

      await logGeneration(identityId, 'regenerate')
      await maybeFireCapAlert(dailyCount + 1, cap)

      if (updatedChat.editsRemaining === 0) {
        await maybeGrantGiftedCycle(user)
      }

      console.log('[GENERATE] Regen saved. chatId=%s duration=%dms',
        chatId.slice(0, 8) + '…', Date.now() - t0)
      return { chatId, isRegenerate: true, messageId, editsRemaining: updatedChat.editsRemaining }
    })
  }

  // ── New blueprint or edit ──────────────────────────────────────────────────
  const isNewChat = !chatId

  if (isNewChat) {
    if (user.creditsRemaining <= 0) return Response.json({ error: 'no_credits' }, { status: 402 })
  } else {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId!)).limit(1)
    if (!chat) return Response.json({ error: 'Chat not found' }, { status: 404 })
    if (chat.userId !== user.id) return Response.json({ error: 'Unauthorized' }, { status: 403 })
    if (chat.editsRemaining <= 0) return Response.json({ error: 'no_edits' }, { status: 402 })
  }

  const context = isNewChat
    ? { currentBlueprint: null, originalUserMessage: null }
    : await loadBlueprintContext({
        chatId: chatId!,
        activeBlueprintMessageId,
        activeBranchIndex,
      })

  const payload = buildPrompt(kind, platform, message, context)

  console.log('[GENERATE] Registered stream start. kind=%s isNewChat=%s msgHash=%s',
    kind, isNewChat, hashForLogging(message))

  return buildStream(payload, async (fullText) => {
    const validation = validateBlueprint(fullText)
    if (!validation.valid) throwBlueprintError(fullText, validation.reason ?? 'invalid')

    const title = message.slice(0, 60).trim() + (message.length > 60 ? '...' : '')
    const encryptedMessage = encrypt(message)
    const encryptedFullText = encrypt(fullText)
    let finalChatId: string
    let editsRemaining: number

    if (isNewChat) {
      const [newChat] = await db
        .insert(chats)
        .values({ userId: user.id, title: encrypt(title) })
        .returning()
      finalChatId = newChat.id
      editsRemaining = newChat.editsRemaining

      const [updatedUser] = await db
        .update(users)
        .set({ creditsRemaining: sql`GREATEST(${users.creditsRemaining} - 1, 0)` })
        .where(eq(users.id, user.id))
        .returning()

      if (updatedUser.creditsRemaining === 0) {
        await maybeGrantGiftedCycle(user)
      }
    } else {
      const [updatedChat] = await db
        .update(chats)
        .set({ editsRemaining: sql`GREATEST(${chats.editsRemaining} - 1, 0)`, updatedAt: new Date() })
        .where(eq(chats.id, chatId!))
        .returning()
      finalChatId = chatId!
      editsRemaining = updatedChat.editsRemaining

      if (updatedChat.editsRemaining === 0) {
        await maybeGrantGiftedCycle(user)
      }
    }

    await db.insert(messages).values([
      { chatId: finalChatId, role: 'user', content: encryptedMessage },
      { chatId: finalChatId, role: 'assistant', content: encryptedFullText },
    ])

    await logGeneration(identityId, kind)
    await maybeFireCapAlert(dailyCount + 1, cap)

    console.log('[GENERATE] Saved. kind=%s chatId=%s duration=%dms',
      kind, finalChatId.slice(0, 8) + '…', Date.now() - t0)

    return { chatId: finalChatId, title, editsRemaining }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// If validation fails and the model returned very little text, it likely produced
// a refusal rather than a blueprint — surface a helpful message instead.
function throwBlueprintError(fullText: string, reason: string): never {
  console.warn('[GENERATE] Blueprint invalid: %s | len=%d', reason, fullText.length)
  if (fullText.trim().length < 400) {
    throw new Error('Blueprnt generates technical blueprints for app ideas. Please describe the app you want to build.')
  }
  throw new Error('blueprint_invalid')
}

async function maybeFireCapAlert(currentCount: number, cap: number): Promise<void> {
  const threshold = Math.floor(cap * 0.8)
  // Fire exactly when crossing the 80% boundary
  if (currentCount === threshold) {
    await alertDailyCapWarning(currentCount, cap).catch(() => {})
  }
}

async function maybeGrantGiftedCycle(user: {
  id: string
  giftedCycleExpiresAt: Date | null
}): Promise<void> {
  const now = new Date()
  if (user.giftedCycleExpiresAt && user.giftedCycleExpiresAt > now) return
  const expires = new Date(now.getTime() + GIFTED_CYCLE_DAYS * 24 * 60 * 60 * 1000)
  await db.update(users).set({ giftedCycleExpiresAt: expires }).where(eq(users.id, user.id))
}
