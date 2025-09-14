// Test database connection
import { db } from './src/db/index.js'
import { usersTable, postsTable } from './src/db/schema.js'
import { count } from 'drizzle-orm'

const testConnection = async () => {
  try {
    console.log('🔌 Testing database connection...')
    
    // Test basic connection
    const userCount = await db.select({ count: count() }).from(usersTable)
    console.log('👥 Total users:', userCount[0]?.count || 0)
    
    const postCount = await db.select({ count: count() }).from(postsTable)
    console.log('📝 Total posts:', postCount[0]?.count || 0)
    
    console.log('✅ Database connection successful!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
  }
}

testConnection()