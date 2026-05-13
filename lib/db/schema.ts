// Drizzle ORM schema — PostgreSQL (Neon)
// TODO: run `pnpm drizzle-kit push` after adding Drizzle + Neon env vars.
// This file is scaffolding only — no DB connection is live yet.

// Uncomment when Drizzle is installed:
// import { pgTable, uuid, varchar, integer, decimal, timestamp, boolean } from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
// export const users = pgTable('users', {
//   id:                        uuid('id').primaryKey().defaultRandom(),
//   identity_type:             varchar('identity_type', { length: 20 }).notNull(), // 'farcaster' | 'privy'
//   farcaster_fid:             varchar('farcaster_fid', { length: 40 }),
//   privy_id:                  varchar('privy_id', { length: 100 }),
//   credits:                   integer('credits').notNull().default(3),
//   share_reward_last_claimed_at: timestamp('share_reward_last_claimed_at'),
//   is_admin:                  boolean('is_admin').notNull().default(false),
//   created_at:                timestamp('created_at').defaultNow(),
//   last_seen_at:              timestamp('last_seen_at').defaultNow(),
// })

// ---------------------------------------------------------------------------
// chats
// ---------------------------------------------------------------------------
// export const chats = pgTable('chats', {
//   id:               uuid('id').primaryKey().defaultRandom(),
//   user_id:          uuid('user_id').references(() => users.id).notNull(),
//   title:            varchar('title', { length: 255 }).notNull().default('New chat'),
//   edits_remaining:  integer('edits_remaining').notNull().default(10),
//   created_at:       timestamp('created_at').defaultNow(),
//   updated_at:       timestamp('updated_at').defaultNow(),
// })

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------
// export const messages = pgTable('messages', {
//   id:         uuid('id').primaryKey().defaultRandom(),
//   chat_id:    uuid('chat_id').references(() => chats.id).notNull(),
//   role:       varchar('role', { length: 10 }).notNull(), // 'user' | 'assistant'
//   content:    varchar('content', { length: 20000 }).notNull(),
//   created_at: timestamp('created_at').defaultNow(),
// })

// ---------------------------------------------------------------------------
// transactions — chain_id defaults to 8453 (Base); kept flexible for future
// ---------------------------------------------------------------------------
// export const transactions = pgTable('transactions', {
//   id:           uuid('id').primaryKey().defaultRandom(),
//   user_id:      uuid('user_id').references(() => users.id).notNull(),
//   type:         varchar('type', { length: 20 }).notNull(), // 'purchase' | 'tip'
//   amount_usdc:  decimal('amount_usdc', { precision: 10, scale: 6 }).notNull(),
//   tx_hash:      varchar('tx_hash', { length: 66 }).notNull(),
//   chain_id:     integer('chain_id').notNull().default(8453), // Base
//   tier:         integer('tier'),
//   created_at:   timestamp('created_at').defaultNow(),
// })

// ---------------------------------------------------------------------------
// tickets
// ---------------------------------------------------------------------------
// export const tickets = pgTable('tickets', {
//   id:           uuid('id').primaryKey().defaultRandom(),
//   user_id:      uuid('user_id').references(() => users.id),
//   title:        varchar('title', { length: 100 }).notNull(),
//   description:  varchar('description', { length: 1000 }).notNull(),
//   status:       varchar('status', { length: 20 }).notNull().default('open'),
//   created_at:   timestamp('created_at').defaultNow(),
//   updated_at:   timestamp('updated_at').defaultNow(),
// })

export {} // keep TypeScript happy until schema is uncommented
