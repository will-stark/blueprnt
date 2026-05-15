import { sendTelegram } from '@/lib/telegram'

export async function alertDailyCapWarning(current: number, cap: number): Promise<void> {
  const pct = Math.round((current / cap) * 100)
  await sendTelegram(
    `🚨 <b>Daily cap at ${pct}%</b>\n` +
    `${current} of ${cap} requests used today.\n` +
    `Resets at midnight UTC.`
  )
}

export async function alertShareVerificationFailed(identityId: string): Promise<void> {
  await sendTelegram(
    `⚠️ <b>Share verification double-fail</b>\n` +
    `User: <code>${identityId}</code>`
  )
}
