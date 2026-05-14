import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Pattern that distinguishes our encrypted strings from plaintext.
// Format: <32-hex-IV>:<32-hex-authTag>:<variable-hex-ciphertext>
const ENCRYPTED_RE = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CRYPTO] ENCRYPTION_KEY must be set in production')
    }
    // Dev-only fallback — all-zeros key, clearly not for production
    return Buffer.alloc(32, 0)
  }
  return Buffer.from(raw, 'hex')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a string previously encrypted with `encrypt()`.
 * If the string doesn't match the encrypted format (i.e. it's legacy plaintext),
 * it is returned unchanged — this covers the migration window.
 */
export function decrypt(text: string): string {
  if (!ENCRYPTED_RE.test(text)) {
    return text // legacy plaintext — not yet migrated
  }
  const key = getKey()
  const [ivHex, authTagHex, ciphertext] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function isEncrypted(text: string): boolean {
  return ENCRYPTED_RE.test(text)
}
