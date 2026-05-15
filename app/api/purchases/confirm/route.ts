import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, decodeEventLog, type Log } from 'viem'
import { base } from 'viem/chains'
import { db } from '@/lib/db'
import { users, chats, transactions, processedEvents } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  CHECKOUT_ADDRESS,
  USDC_ADDRESS,
  SKU_PRICES,
  SKU_CREDITS,
  SKU_EDITS,
  CHECKOUT_ABI,
  isCreditSku,
  isEditRefillSku,
  isTipSku,
  refToChatId,
  type SkuId,
} from '@/lib/contracts'

// Public client — module-level singleton
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? 'https://mainnet.base.org'),
})

// Purchase event topic0 (keccak256 of the signature)
const PURCHASE_EVENT_SIGNATURE = 'Purchase(address,uint8,uint256,bytes32)'

export async function POST(req: NextRequest) {
  let body: {
    txHash?: string
    sku?: number
    identityId?: string
    chatId?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { txHash, sku, identityId, chatId } = body

  if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
    return NextResponse.json({ error: 'Invalid txHash' }, { status: 400 })
  }
  if (typeof sku !== 'number') {
    return NextResponse.json({ error: 'Missing sku' }, { status: 400 })
  }
  if (!identityId) {
    return NextResponse.json({ error: 'Missing identityId' }, { status: 400 })
  }
  if (isEditRefillSku(sku) && !chatId) {
    return NextResponse.json({ error: 'chatId required for edit refill' }, { status: 400 })
  }
  if (!(sku in SKU_PRICES)) {
    return NextResponse.json({ error: 'Unknown SKU' }, { status: 400 })
  }

  // ── Look up user ────────────────────────────────────────────────────────────
  const [user] = await db.select().from(users).where(eq(users.identityId, identityId)).limit(1)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ── Idempotency check — already processed? ──────────────────────────────────
  const [existing] = await db
    .select()
    .from(processedEvents)
    .where(eq(processedEvents.txHash, txHash))
    .limit(1)

  if (existing) {
    return NextResponse.json(
      { message: 'already_processed', creditsAdded: existing.creditsDelta ?? 0, editsAdded: existing.editsDelta ?? 0 },
      { status: 409 }
    )
  }

  // ── Fetch transaction receipt from Base ─────────────────────────────────────
  let receipt: Awaited<ReturnType<typeof publicClient.getTransactionReceipt>>
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
  } catch {
    return NextResponse.json({ error: 'Transaction not yet confirmed. Please retry shortly.' }, { status: 404 })
  }

  if (receipt.status === 'reverted') {
    return NextResponse.json({ error: 'Transaction was reverted on-chain.' }, { status: 422 })
  }

  // ── Validate contract address ───────────────────────────────────────────────
  if (!CHECKOUT_ADDRESS) {
    console.error('[CONFIRM] NEXT_PUBLIC_CHECKOUT_ADDRESS not configured')
    return NextResponse.json({ error: 'Payment processing not configured.' }, { status: 503 })
  }

  // ── Find and decode Purchase event ─────────────────────────────────────────
  const purchaseLog = receipt.logs.find(
    (log: Log) =>
      log.address.toLowerCase() === CHECKOUT_ADDRESS.toLowerCase()
  )

  if (!purchaseLog) {
    return NextResponse.json(
      { error: 'Purchase event not found. Transaction did not call BlueprnCheckout.' },
      { status: 422 }
    )
  }

  let decoded: {
    eventName: string
    args: { buyer: `0x${string}`; sku: number; amount: bigint; ref: `0x${string}` }
  }

  try {
    decoded = decodeEventLog({
      abi: CHECKOUT_ABI,
      data: purchaseLog.data,
      topics: purchaseLog.topics as [`0x${string}`, ...`0x${string}`[]],
      eventName: 'Purchase',
    }) as typeof decoded
  } catch (err) {
    console.error('[CONFIRM] Failed to decode Purchase event:', err)
    return NextResponse.json({ error: 'Could not decode purchase event.' }, { status: 422 })
  }

  const event = decoded.args

  // ── Validate buyer ──────────────────────────────────────────────────────────
  if (!user.walletAddress) {
    return NextResponse.json(
      { error: 'No wallet address on file for this account. Contact support.' },
      { status: 422 }
    )
  }

  if (event.buyer.toLowerCase() !== user.walletAddress.toLowerCase()) {
    console.warn(
      '[CONFIRM] Buyer mismatch: event=%s user=%s identityId=%s',
      event.buyer, user.walletAddress, identityId.slice(0, 10)
    )
    return NextResponse.json({ error: 'Transaction buyer does not match account wallet.' }, { status: 422 })
  }

  // ── Validate SKU ────────────────────────────────────────────────────────────
  if (event.sku !== sku) {
    return NextResponse.json({ error: `SKU mismatch: event=${event.sku} expected=${sku}` }, { status: 422 })
  }

  // ── Validate amount ─────────────────────────────────────────────────────────
  const expectedPrice = SKU_PRICES[sku as SkuId]
  if (event.amount !== expectedPrice) {
    return NextResponse.json(
      { error: `Amount mismatch: event=${event.amount} expected=${expectedPrice}` },
      { status: 422 }
    )
  }

  // ── Validate chatId for edit refill ─────────────────────────────────────────
  let resolvedChatId: string | null = null
  if (isEditRefillSku(sku)) {
    const eventChatId = refToChatId(event.ref)
    if (chatId && eventChatId.toLowerCase() !== chatId.toLowerCase()) {
      return NextResponse.json(
        { error: 'chatId in event ref does not match provided chatId.' },
        { status: 422 }
      )
    }
    resolvedChatId = eventChatId
  }

  // ── Determine deltas ────────────────────────────────────────────────────────
  const creditsDelta = SKU_CREDITS[sku as SkuId]
  const editsDelta   = SKU_EDITS[sku as SkuId]
  const txType       = isCreditSku(sku) ? 'purchase' : isEditRefillSku(sku) ? 'edit_refill' : 'tip'
  const amountUsdc   = (Number(event.amount) / 1_000_000).toFixed(6)

  // ── Apply effects atomically ────────────────────────────────────────────────
  // processedEvents has a UNIQUE constraint on txHash — concurrent requests
  // will fail on the second insert, preventing double-crediting.
  try {
    await db.transaction(async (tx) => {
      // 1. Mark as processed (unique constraint is the idempotency guard)
      await tx.insert(processedEvents).values({
        txHash,
        userId:       user.id,
        creditsDelta: creditsDelta > 0 ? creditsDelta : null,
        editsDelta:   editsDelta   > 0 ? editsDelta   : null,
        chatId:       resolvedChatId,
        sku,
      })

      // 2. Record the transaction
      await tx.insert(transactions).values({
        userId:      user.id,
        type:        txType,
        amountUsdc,
        txHash,
        chainId:     8453,
        sku,
        chatId:      resolvedChatId,
        creditsDelta: creditsDelta > 0 ? creditsDelta : null,
        editsDelta:   editsDelta   > 0 ? editsDelta   : null,
      })

      // 3. Apply credits
      if (creditsDelta > 0) {
        await tx
          .update(users)
          .set({ creditsRemaining: sql`${users.creditsRemaining} + ${creditsDelta}` })
          .where(eq(users.id, user.id))
      }

      // 4. Apply edits to the specific chat
      if (editsDelta > 0 && resolvedChatId) {
        const [chat] = await tx
          .select()
          .from(chats)
          .where(eq(chats.id, resolvedChatId))
          .limit(1)

        if (!chat || chat.userId !== user.id) {
          throw new Error('chat_not_found_or_unauthorized')
        }

        await tx
          .update(chats)
          .set({ editsRemaining: sql`${chats.editsRemaining} + ${editsDelta}` })
          .where(eq(chats.id, resolvedChatId))
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    // Unique constraint = already processed (race condition)
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { message: 'already_processed', creditsAdded: 0, editsAdded: 0 },
        { status: 409 }
      )
    }

    if (msg === 'chat_not_found_or_unauthorized') {
      return NextResponse.json({ error: 'Chat not found or does not belong to this account.' }, { status: 422 })
    }

    console.error('[CONFIRM] DB error for txHash=%s: %s', txHash.slice(0, 20) + '…', msg)
    return NextResponse.json({ error: 'Database error. Please contact support.' }, { status: 500 })
  }

  console.log(
    '[CONFIRM] Processed: txHash=%s sku=%d credits+%d edits+%d userId=%s',
    txHash.slice(0, 20) + '…', sku, creditsDelta, editsDelta, user.id.slice(0, 8) + '…'
  )

  return NextResponse.json({
    success: true,
    creditsAdded: creditsDelta,
    editsAdded:   editsDelta,
    txType,
  })
}

// suppress unused import warning — used for type reference only
void PURCHASE_EVENT_SIGNATURE
void USDC_ADDRESS
