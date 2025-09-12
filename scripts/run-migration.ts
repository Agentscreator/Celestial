import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    console.log('Running event themes migration...')
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '013_add_event_themes.sql')
    const migrationContent = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration content as a single block
    try {
      await db.execute(sql.raw(migrationContent))
      console.log('✓ Migration executed successfully')
    } catch (error) {
      console.log('⚠ Migration may have already been executed:', error)
    }
    
    // Check if themes were inserted
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM event_themes`)
    console.log(`✓ Migration completed. Found ${result.rows[0].count} themes in database.`)
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()