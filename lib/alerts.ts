// Lightweight alert helpers — Resend email + Telegram message

const RESEND_API = 'https://api.resend.com/emails'
const TELEGRAM_API = 'https://api.telegram.org'

async function sendResendEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL
  const to     = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean)

  if (!apiKey || !from || !to?.length) return

  await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  }).catch(() => {/* non-critical — swallow */})
}

async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {/* non-critical — swallow */})
}

// ---------------------------------------------------------------------------
// Exported alert functions
// ---------------------------------------------------------------------------

export async function alertDailyCapWarning(current: number, cap: number): Promise<void> {
  const pct = Math.round((current / cap) * 100)
  const subject = `[Blueprnt] Daily cap at ${pct}% (${current}/${cap})`
  const html = `<p>Daily generation cap is at <strong>${pct}%</strong>.</p><p>${current} of ${cap} requests used today.</p>`
  await Promise.all([sendResendEmail(subject, html), sendTelegram(`🚨 ${subject}`)])
}

export async function alertShareVerificationFailed(identityId: string): Promise<void> {
  const subject = '[Blueprnt] Share verification double-fail'
  const html = `<p>User <code>${identityId}</code> failed share verification twice in a row.</p>`
  await Promise.all([sendResendEmail(subject, html), sendTelegram(`⚠️ ${subject}\nUser: ${identityId}`)])
}
