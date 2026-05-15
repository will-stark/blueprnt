import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  bigint,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id:                       uuid('id').primaryKey().defaultRandom(),
  identityType:             varchar('identity_type', { length: 20 }).notNull(), // 'farcaster' | 'privy'
  identityId:               varchar('identity_id', { length: 100 }).notNull().unique(), // FID (string) or Privy ID
  email:                    varchar('email', { length: 255 }),
  username:                 varchar('username', { length: 100 }),
  walletAddress:            varchar('wallet_address', { length: 42 }),
  pfpUrl:                   text('pfp_url'),
  creditsRemaining:         integer('credits_remaining').notNull().default(3),
  purchasedCreditsRemaining: integer('purchased_credits_remaining').notNull().default(0),
  giftedCycleExpiresAt:     timestamp('gifted_cycle_expires_at'),
  creditCycleExpiresAt:     timestamp('credit_cycle_expires_at'),
  shareRewardLastClaimedAt: timestamp('share_reward_last_claimed_at'),
  isAdmin:                  boolean('is_admin').notNull().default(false),
  createdAt:                timestamp('created_at').defaultNow(),
  lastSeenAt:               timestamp('last_seen_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// chats
// ---------------------------------------------------------------------------
export const chats = pgTable('chats', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').references(() => users.id).notNull(),
  title:          text('title').notNull().default('New chat'),
  editsRemaining: integer('edits_remaining').notNull().default(3),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------
export const messages = pgTable('messages', {
  id:        uuid('id').primaryKey().defaultRandom(),
  chatId:    uuid('chat_id').references(() => chats.id).notNull(),
  role:      varchar('role', { length: 10 }).notNull(), // 'user' | 'assistant'
  content:   text('content').notNull(),
  branches:  jsonb('branches').default([]),
  createdAt: timestamp('created_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// transactions — onchain USDC payments; chain_id 8453 = Base
// ---------------------------------------------------------------------------
export const transactions = pgTable('transactions', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id).notNull(),
  type:         varchar('type', { length: 20 }).notNull(), // 'purchase' | 'edit_refill' | 'tip'
  amountUsdc:   decimal('amount_usdc', { precision: 10, scale: 6 }).notNull(),
  txHash:       varchar('tx_hash', { length: 66 }).notNull(),
  chainId:      integer('chain_id').notNull().default(8453),
  tier:         integer('tier'),           // legacy — use sku for new rows
  sku:          integer('sku'),            // contract SKU id (0-3, 10, 20-22)
  chatId:       uuid('chat_id').references(() => chats.id), // edit refill only
  creditsDelta: integer('credits_delta'),
  editsDelta:   integer('edits_delta'),    // edit refill only
  createdAt:    timestamp('created_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// events — raw onchain events detected (before processing)
// ---------------------------------------------------------------------------
export const events = pgTable('events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  txHash:      varchar('tx_hash', { length: 66 }).notNull().unique(),
  fromAddress: varchar('from_address', { length: 42 }).notNull(),
  toAddress:   varchar('to_address', { length: 42 }).notNull(),
  amountUsdc:  decimal('amount_usdc', { precision: 10, scale: 6 }).notNull(),
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  chainId:     integer('chain_id').notNull().default(8453),
  eventType:   varchar('event_type', { length: 50 }).default('usdc_transfer'),
  metadata:    jsonb('metadata'),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// processed_events — deduplication ledger; one row per processed tx_hash
// ---------------------------------------------------------------------------
export const processedEvents = pgTable('processed_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  txHash:       varchar('tx_hash', { length: 66 }).notNull().unique(),
  userId:       uuid('user_id').references(() => users.id),
  sku:          integer('sku'),            // contract SKU id
  chatId:       uuid('chat_id').references(() => chats.id), // edit refill only
  creditsDelta: integer('credits_delta'),
  editsDelta:   integer('edits_delta'),    // edit refill only
  processedAt:  timestamp('processed_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// tickets — support tickets from registered users
// ---------------------------------------------------------------------------
export const tickets = pgTable('tickets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id),
  identityType: varchar('identity_type', { length: 20 }), // 'farcaster' | 'privy'
  identityId:   varchar('identity_id', { length: 100 }),
  title:        varchar('title', { length: 100 }).notNull(),
  description:  varchar('description', { length: 1000 }).notNull(),
  status:       varchar('status', { length: 20 }).notNull().default('open'),
  notes:        jsonb('notes').default([]),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
})
