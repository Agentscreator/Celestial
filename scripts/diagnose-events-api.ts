import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function diagnoseEventsAPI() {
  try {
    console.log('🔍 Diagnosing Events API issues...\n')
    
    // Check if event_themes table exists
    console.log('1. Checking if event_themes table exists:')
    try {
      const themesResult = await db.execute(sql`SELECT COUNT(*) as count FROM event_themes`)
      console.log(`✅ event_themes table exists with ${themesResult.rows[0].count} themes`)
    } catch (error) {
      console.log(`❌ event_themes table does not exist:`, error.message)
      console.log('   This could cause the API to fail when joining themes')
    }
    
    // Check if events table has theme columns
    console.log('\n2. Checking if events table has theme columns:')
    try {
      const result = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name IN ('theme_id', 'custom_flyer_url', 'flyer_data')
        ORDER BY column_name
      `)
      
      const columns = result.rows.map(row => row.column_name)
      console.log('Found theme columns:', columns)
      
      if (columns.length === 3) {
        console.log('✅ All theme columns exist')
      } else {
        console.log('⚠️  Missing theme columns:', ['theme_id', 'custom_flyer_url', 'flyer_data'].filter(col => !columns.includes(col)))
      }
    } catch (error) {
      console.log('❌ Error checking events table columns:', error.message)
    }
    
    // Test the actual query from the API
    console.log('\n3. Testing the events API query:')
    try {
      const testResult = await db.execute(sql`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.location,
          e.event_date,
          e.event_time,
          e.max_participants,
          e.current_participants,
          e.created_by,
          e.share_token,
          e.is_active,
          e.is_invite,
          e.invite_description,
          e.group_name,
          e.theme_id,
          e.custom_flyer_url,
          e.flyer_data,
          e.created_at,
          e.updated_at,
          u.username,
          u.nickname,
          u.profile_image,
          t.id as theme_id_2,
          t.name as theme_name,
          t.display_name as theme_display_name
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN event_themes t ON e.theme_id = t.id
        WHERE e.is_active = 1
        ORDER BY e.created_at DESC
        LIMIT 5
      `)
      
      console.log(`✅ Query executed successfully, found ${testResult.rows.length} events`)
      
      if (testResult.rows.length > 0) {
        console.log('Sample event data:')
        const event = testResult.rows[0]
        console.log(`  - ID: ${event.id}`)
        console.log(`  - Title: ${event.title}`)
        console.log(`  - Created by: ${event.username}`)
        console.log(`  - Theme: ${event.theme_name || 'No theme'}`)
      }
      
    } catch (error) {
      console.log('❌ Events query failed:', error.message)
      console.log('   This is likely the cause of "failed to load events"')
    }
    
    // Check user sessions / auth
    console.log('\n4. Checking users table:')
    try {
      const usersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`)
      console.log(`✅ Users table exists with ${usersResult.rows[0].count} users`)
    } catch (error) {
      console.log(`❌ Users table issue:`, error.message)
    }
    
    console.log('\n🏁 Diagnosis complete!')
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
    process.exit(1)
  }
}

diagnoseEventsAPI()