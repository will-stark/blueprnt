import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('Adding has_purchased_credits column to users…')

await sql`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_purchased_credits boolean NOT NULL DEFAULT false
`
console.log('  Column added.')

// Mark any user who has existing credit purchase transactions as a purchaser
const result = await sql`
  UPDATE users
  SET has_purchased_credits = true
  WHERE id IN (
    SELECT DISTINCT user_id FROM transactions WHERE type = 'purchase'
  )
`
console.log(`  Existing purchasers flagged: ${result.count}`)

await sql.end()
console.log('Done.')
