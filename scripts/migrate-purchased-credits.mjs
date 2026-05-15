import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('Adding purchased_credits_remaining column to users…')

await sql`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS purchased_credits_remaining integer NOT NULL DEFAULT 0
`
console.log('  Column added (default 0 for all existing users).')

await sql.end()
console.log('Done.')
