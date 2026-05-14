import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'
import { users, chats, messages } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { isAnonymousLimitHit, logAnonymousGeneration } from '@/lib/db/anonymous-limit'

export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL_PRIMARY = 'gemini-2.0-flash-thinking-exp-01-21'
const MODEL_FALLBACK = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `You are a technical blueprint generator for Blueprnt. When a user describes an app idea, produce a comprehensive 5-section technical document.

Your output MUST follow this exact structure with these exact headings:

# Section 1 — Expanded Overview
Cover: target users, core problem being solved, key success criteria, and scope boundaries.

# Section 2 — Core Elements
Cover: full feature list, authentication strategy, database schema (tables + key fields), external APIs needed, user roles/permissions, and client-side state management.

# Section 3 — Basic + Extended Logic
Cover: all major data flows, edge cases and error states, rate limiting, race conditions, and security considerations.

# Section 4 — Full Workflow
Numbered step-by-step walkthrough of every screen, user action, and transition — including loading states, empty states, and error states. Cover both happy path and failure paths.

# Section 5 — Cost of Development
Three tiers with real service names and current pricing:
- **Free / OSS tier** — what can be built for $0/month
- **Indie Builder tier** — realistic paid-tier stack (~$20–100/month)
- **At Scale tier** — what it costs at 10k+ users/month

RULES:
- Always output all 5 sections in order. Never skip a section.
- Use Markdown: headers, bullet lists, numbered lists, code blocks where helpful.
- Be specific: name exact services (Supabase, Neon, Clerk, Vercel, etc.) with real pricing.
- For schemas: show table names and key columns. For APIs: show endpoint shapes.
- For workflows: number every step. Cover both success and failure paths.
- If the user mentions Farcaster: tailor the blueprint to Farcaster mini-app specs (Frame SDK, Warpcast, FID-based auth, USDC on Base).

If the request is clearly not an app idea, respond only with:
"I can only generate technical blueprints for app ideas. Please describe an app, tool, or platform you want to build."
`

const encoder = new TextEncoder()

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

// ─── Hard filters ─────────────────────────────────────────────────────────────

const BLOCKLIST = [
  'porn', 'nsfw', 'xxx', 'nude', 'onlyfans',
  'exploit', 'ddos', 'ransomware', 'keylogger',
]

function applyHardFilters(message: string): string | null {
  if (message.trim().length < 10) return 'Message too short. Please describe your app idea in more detail.'
  const lower = message.toLowerCase()
  if (BLOCKLIST.some((w) => lower.includes(w))) return 'Your message contains blocked content.'
  return null
}

// ─── Gemini call with fallback ────────────────────────────────────────────────

async function generateStream(message: string) {
  const opts = { systemInstruction: SYSTEM_PROMPT }
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_PRIMARY, ...opts })
    return await model.generateContentStream(message)
  } catch {
    console.warn('[GENERATE] Primary model failed, falling back to', MODEL_FALLBACK)
    const model = genAI.getGenerativeModel({ model: MODEL_FALLBACK, ...opts })
    return await model.generateContentStream(message)
  }
}

// ─── Shared stream builder ────────────────────────────────────────────────────

function buildStream(
  message: string,
  onComplete: (fullText: string) => Promise<Record<string, unknown> | void>
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generateStream(message)
        let fullText = ''

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullText += text
            send(controller, { text })
          }
        }

        // Only save/deduct AFTER successful completion
        const meta = await onComplete(fullText)
        send(controller, { done: true, ...(meta ?? {}) })
        controller.close()
      } catch (err) {
        console.error('[GENERATE] Stream error: %s', err instanceof Error ? err.message : String(err))
        if (err instanceof Error) console.error('[GENERATE] Stream stack:', err.stack)
        send(controller, { error: 'Generation failed. Please try again.' })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  console.log('[GENERATE] POST hit:', new Date().toISOString())

  try {
    const body = await req.json()
    const { userType, message } = body

    console.log('[GENERATE] Params: userType=%s msgLen=%d chatId=%s identityId=%s anonId=%s',
      userType,
      message?.length ?? 0,
      body.chatId ?? 'none',
      body.identityId ? body.identityId.slice(0, 10) + '…' : 'none',
      body.anonymousId ? body.anonymousId.slice(0, 8) + '…' : 'none',
    )

    if (!userType || !message?.trim()) {
      console.warn('[GENERATE] Missing required fields: userType=%s hasMessage=%s', userType, !!message?.trim())
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const filterError = applyHardFilters(message)
    if (filterError) {
      console.warn('[GENERATE] Hard filter blocked message: %s', filterError)
      return Response.json({ error: filterError }, { status: 400 })
    }

    // ── Anonymous ──────────────────────────────────────────────────────────
    if (userType === 'anonymous') {
      const { anonymousId } = body
      if (!anonymousId) {
        console.warn('[GENERATE] Anonymous request missing anonymousId')
        return Response.json({ error: 'Missing anonymousId' }, { status: 400 })
      }
      const limitHit = await isAnonymousLimitHit(anonymousId)
      if (limitHit) {
        console.log('[GENERATE] Anonymous limit hit for id=%s', anonymousId.slice(0, 8) + '…')
        return Response.json({ error: 'no_credits' }, { status: 402 })
      }

      console.log('[GENERATE] Anonymous path — starting stream')
      return buildStream(message, async () => {
        await logAnonymousGeneration(anonymousId)
        console.log('[GENERATE] Anonymous generation logged. duration=%dms', Date.now() - t0)
        // No chatId returned — client handles localStorage
      })
    }

    // ── Registered (privy / farcaster) ─────────────────────────────────────
    const { identityId, chatId } = body
    if (!identityId) {
      console.warn('[GENERATE] Registered request missing identityId')
      return Response.json({ error: 'Missing identityId' }, { status: 400 })
    }

    const userRows = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
    if (userRows.length === 0) {
      console.warn('[GENERATE] User not found: identityId=%s', identityId.slice(0, 10) + '…')
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userRows[0]

    const isNewChat = !chatId
    console.log('[GENERATE] User found: dbId=%s credits=%d isNewChat=%s',
      user.id.slice(0, 8) + '…', user.creditsRemaining, isNewChat)

    if (isNewChat) {
      if (user.creditsRemaining <= 0) {
        console.log('[GENERATE] No credits remaining for user=%s', user.id.slice(0, 8) + '…')
        return Response.json({ error: 'no_credits' }, { status: 402 })
      }
    } else {
      const chatRows = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
      if (chatRows.length === 0) {
        console.warn('[GENERATE] Chat not found: chatId=%s', chatId)
        return Response.json({ error: 'Chat not found' }, { status: 404 })
      }
      if (chatRows[0].editsRemaining <= 0) {
        console.log('[GENERATE] No edits remaining: chatId=%s', chatId.slice(0, 8) + '…')
        return Response.json({ error: 'no_edits' }, { status: 402 })
      }
      console.log('[GENERATE] Edit check passed: editsRemaining=%d', chatRows[0].editsRemaining)
    }

    console.log('[GENERATE] Registered path — starting stream. isNewChat=%s', isNewChat)

    return buildStream(message, async (fullText) => {
      const title = message.slice(0, 60).trim() + (message.length > 60 ? '...' : '')
      let finalChatId: string = chatId

      if (isNewChat) {
        const [newChat] = await db.insert(chats).values({ userId: user.id, title }).returning()
        finalChatId = newChat.id
        await db
          .update(users)
          .set({ creditsRemaining: sql`GREATEST(${users.creditsRemaining} - 1, 0)` })
          .where(eq(users.id, user.id))
        console.log('[GENERATE] New chat created: chatId=%s creditsAfter=%d duration=%dms',
          finalChatId.slice(0, 8) + '…', user.creditsRemaining - 1, Date.now() - t0)
      } else {
        await db
          .update(chats)
          .set({
            editsRemaining: sql`GREATEST(${chats.editsRemaining} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(chats.id, chatId))
        console.log('[GENERATE] Chat updated (edit): chatId=%s duration=%dms',
          chatId.slice(0, 8) + '…', Date.now() - t0)
      }

      await db.insert(messages).values([
        { chatId: finalChatId, role: 'user', content: message },
        { chatId: finalChatId, role: 'assistant', content: fullText },
      ])
      console.log('[GENERATE] Messages saved: chatId=%s assistantLen=%d',
        finalChatId.slice(0, 8) + '…', fullText.length)

      return { chatId: finalChatId, title }
    })
  } catch (err) {
    console.error('[GENERATE] Unhandled error after %dms: %s', Date.now() - t0,
      err instanceof Error ? err.message : String(err))
    if (err instanceof Error) console.error('[GENERATE] Stack:', err.stack)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
