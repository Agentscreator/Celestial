require('dotenv/config');
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

async function checkDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    return;
  }

  console.log('🔍 Checking database connection...');
  
  try {
    const sql = neon(connectionString, { fullResults: true });
    const db = drizzle(sql);
    
    // Check if events table exists
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('events', 'event_participants', 'event_themes')
      ORDER BY table_name;
    `;
    
    console.log('📋 Tables found:', tablesResult.rows?.map(t => t.table_name) || tablesResult.map?.(t => t.table_name) || 'Unable to parse result');
    
    // Check events table structure
    const eventsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('🏗️  Events table columns:');
    const columns = eventsColumns.rows || eventsColumns;
    if (columns && columns.length > 0) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('  ❌ No columns found or events table does not exist');
    }
    
    // Check if event_themes table has data
    const themesCount = await sql`SELECT COUNT(*) as count FROM event_themes WHERE is_active = 1`;
    const count = themesCount.rows?.[0]?.count || themesCount[0]?.count || 'unknown';
    console.log(`🎨 Active themes count: ${count}`);
    
    // Test a simple insert (then rollback)
    console.log('🧪 Testing insert operation...');
    await sql.begin(async sql => {
      const testResult = await sql`
        INSERT INTO events (
          title, description, location, event_date, event_time, 
          created_by, share_token, current_participants
        ) VALUES (
          'Test Event', 'Test Description', 'Test Location', 
          CURRENT_DATE + INTERVAL '1 day', '12:00',
          (SELECT id FROM users LIMIT 1), 'test-token-' || extract(epoch from now()), 1
        ) RETURNING id;
      `;
      console.log('✅ Insert test successful, rolling back...');
      throw new Error('Rollback test'); // Force rollback
    }).catch(err => {
      if (err.message === 'Rollback test') {
        console.log('✅ Database operations working correctly');
      } else {
        console.error('❌ Insert test failed:', err.message);
      }
    });
    
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Full error:', error);
  }
}

checkDatabase();