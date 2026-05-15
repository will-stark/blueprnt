/**
 * Onchain constants and ABIs for BlueprnCheckout on Base mainnet.
 * Set NEXT_PUBLIC_CHECKOUT_ADDRESS in .env.local after deployment.
 */

// ─── Addresses ────────────────────────────────────────────────────────────────

export const CHECKOUT_ADDRESS =
  (process.env.NEXT_PUBLIC_CHECKOUT_ADDRESS ?? '') as `0x${string}`

// Circle USDC on Base mainnet — canonical, never changes
export const USDC_ADDRESS =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`

// Base mainnet chain ID
export const BASE_CHAIN_ID = 8453

// ─── SKU definitions ──────────────────────────────────────────────────────────

export const SKU = {
  CREDIT_1:   0,   // 1 credit   $0.50
  CREDIT_2:   1,   // 2 credits  $1.00
  CREDIT_12:  2,   // 12 credits $5.00
  CREDIT_25:  3,   // 25 credits $10.00
  EDIT_REFILL: 10, // 10 edits   $0.25
  TIP_5:      20,  // tip $5
  TIP_10:     21,  // tip $10
  TIP_15:     22,  // tip $15
} as const

export type SkuId = (typeof SKU)[keyof typeof SKU]

// Prices in USDC (6 decimals = micro-USDC)
export const SKU_PRICES: Record<SkuId, bigint> = {
  [SKU.CREDIT_1]:    500_000n,
  [SKU.CREDIT_2]:  1_000_000n,
  [SKU.CREDIT_12]: 5_000_000n,
  [SKU.CREDIT_25]: 10_000_000n,
  [SKU.EDIT_REFILL]: 250_000n,
  [SKU.TIP_5]:     5_000_000n,
  [SKU.TIP_10]:   10_000_000n,
  [SKU.TIP_15]:   15_000_000n,
}

// Credits granted per SKU (0 for edit refill and tips)
export const SKU_CREDITS: Record<SkuId, number> = {
  [SKU.CREDIT_1]:    1,
  [SKU.CREDIT_2]:    2,
  [SKU.CREDIT_12]:  12,
  [SKU.CREDIT_25]:  25,
  [SKU.EDIT_REFILL]: 0,
  [SKU.TIP_5]:       0,
  [SKU.TIP_10]:      0,
  [SKU.TIP_15]:      0,
}

// Edits granted per SKU (0 for everything except edit refill)
export const SKU_EDITS: Record<SkuId, number> = {
  [SKU.CREDIT_1]:    0,
  [SKU.CREDIT_2]:    0,
  [SKU.CREDIT_12]:   0,
  [SKU.CREDIT_25]:   0,
  [SKU.EDIT_REFILL]: 10,
  [SKU.TIP_5]:       0,
  [SKU.TIP_10]:      0,
  [SKU.TIP_15]:      0,
}

export function isCreditSku(sku: number): boolean {
  return sku >= 0 && sku <= 3
}
export function isEditRefillSku(sku: number): boolean {
  return sku === SKU.EDIT_REFILL
}
export function isTipSku(sku: number): boolean {
  return sku >= 20 && sku <= 22
}

// ─── ABIs (minimal — only what the frontend calls) ────────────────────────────

export const CHECKOUT_ABI = [
  {
    type: 'function',
    name: 'purchase',
    inputs: [
      { name: 'sku', type: 'uint8' },
      { name: 'ref', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'priceOf',
    inputs: [{ name: 'sku', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Purchase',
    inputs: [
      { name: 'buyer',  type: 'address', indexed: true  },
      { name: 'sku',    type: 'uint8',   indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'ref',    type: 'bytes32', indexed: true  },
    ],
  },
] as const

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

// ─── Ref encoding helpers ─────────────────────────────────────────────────────

/**
 * Encode a UUID chatId as bytes32 for use as the `ref` field in an edit refill
 * purchase. UUIDs are 128 bits (16 bytes), zero-padded to 32 bytes on the right.
 */
export function chatIdToRef(chatId: string): `0x${string}` {
  const hex = chatId.replace(/-/g, '') // 32 hex chars = 16 bytes
  // left-pad to 64 hex chars (32 bytes) — UUID occupies the LOW bytes
  return `0x${hex.padStart(64, '0')}` as `0x${string}`
}

/**
 * Decode a bytes32 ref back to a UUID chatId string.
 * Strips the leading zero-padding and formats as UUID.
 */
export function refToChatId(ref: string): string {
  const hex = ref.startsWith('0x') ? ref.slice(2) : ref
  // UUID is stored in the last 32 hex chars (16 bytes)
  const uuidHex = hex.slice(-32)
  return [
    uuidHex.slice(0, 8),
    uuidHex.slice(8, 12),
    uuidHex.slice(12, 16),
    uuidHex.slice(16, 20),
    uuidHex.slice(20, 32),
  ].join('-')
}
