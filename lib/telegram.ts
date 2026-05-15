const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID

export async function sendTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    })
  } catch {
    // never block a response over an alert failure
  }
}

// ─── Alert templates ──────────────────────────────────────────────────────────

export function alertNewUser({
  identityType,
  identityId,
  username,
}: {
  identityType: string
  identityId: string
  username?: string | null
}) {
  const handle = username ? `@${username}` : identityId.slice(0, 10)
  return sendTelegram(
    `👤 <b>New user</b>\n` +
    `${handle} · ${identityType}\n` +
    `ID: <code>${identityId}</code>`
  )
}

export function alertPurchase({
  sku,
  amountUsdc,
  txHash,
  username,
  identityId,
  txType,
}: {
  sku: number
  amountUsdc: string
  txHash: string
  username?: string | null
  identityId: string
  txType: string
}) {
  const handle = username ? `@${username}` : identityId.slice(0, 10)
  const shortTx = `${txHash.slice(0, 10)}…${txHash.slice(-6)}`
  const emoji = txType === 'tip' ? '🎁' : '💰'
  return sendTelegram(
    `${emoji} <b>${txType === 'tip' ? 'Tip' : txType === 'edit_refill' ? 'Edit refill' : 'Purchase'}</b>\n` +
    `SKU ${sku} · $${amountUsdc} USDC\n` +
    `User: ${handle}\n` +
    `Tx: <code>${shortTx}</code>`
  )
}

export function alertTicket({
  identityId,
  username,
  title,
  description,
}: {
  identityId: string
  username?: string | null
  title: string
  description: string
}) {
  const handle = username ? `@${username}` : identityId.slice(0, 10)
  const preview = description.length > 120 ? description.slice(0, 120) + '…' : description
  return sendTelegram(
    `🎫 <b>Support ticket</b>\n` +
    `From: ${handle}\n` +
    `<b>${title}</b>\n` +
    `${preview}`
  )
}
