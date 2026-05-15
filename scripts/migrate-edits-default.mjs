import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('Updating chats column default and resetting old starter edits…')

await sql`ALTER TABLE chats ALTER COLUMN edits_remaining SET DEFAULT 3`
console.log('  Column default set to 3')

const result = await sql`UPDATE chats SET edits_remaining = 3 WHERE edits_remaining = 10`
console.log(`  Rows updated: ${result.count}`)

await sql.end()
console.log('Done.')
