export function isAdmin(
  identityType: string | null,
  identityId: string | null,
  email?: string | null,
): boolean {
  if (!identityType || !identityId) return false

  if (identityType === 'farcaster') {
    const fids = (process.env.ADMIN_FIDS ?? '').split(',').map((f) => f.trim()).filter(Boolean)
    return fids.includes(identityId)
  }

  if (identityType === 'privy' && email) {
    const emails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    return emails.includes(email.toLowerCase())
  }

  return false
}
