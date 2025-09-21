// Quick database verification for posts table
console.log('🔍 Verifying posts table structure and data...')

async function verifyDatabase() {
  try {
    // Test database connection
    console.log('\n1️⃣ Testing database connection...')
    const dbResponse = await fetch('/api/test-db')
    if (dbResponse.ok) {
      const dbResult = await dbResponse.json()
      console.log('✅ Database connection:', dbResult.status)
    } else {
      console.error('❌ Database connection failed')
      return
    }

    // Check current user
    console.log('\n2️⃣ Getting current user...')
    const sessionResponse = await fetch('/api/auth/session')
    if (!sessionResponse.ok) {
      console.error('❌ No session')
      return
    }
    
    const session = await sessionResponse.json()
    if (!session?.user?.id) {
      console.error('❌ No user ID')
      return
    }
    
    console.log('✅ Current user:', session.user.email)
    const userId = session.user.id

    // Check posts count for this user
    console.log('\n3️⃣ Checking existing posts...')
    const postsResponse = await fetch(`/api/posts?userId=${userId}`)
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      console.log('📊 Current posts count:', postsData.posts?.length || 0)
      
      if (postsData.posts?.length > 0) {
        console.log('📝 Recent posts:')
        postsData.posts.slice(0, 3).forEach((post, i) => {
          console.log(`  ${i + 1}. ID: ${post.id}, Content: "${post.content?.substring(0, 30)}...", Created: ${post.createdAt}`)
        })
      } else {
        console.log('📝 No posts found for this user')
      }
    } else {
      console.error('❌ Failed to fetch posts:', postsResponse.status)
    }

    // Try to create a simple post using the debug endpoint
    console.log('\n4️⃣ Testing post creation...')
    const testContent = `Database verification test - ${new Date().toISOString()}`
    
    const createFormData = new FormData()
    createFormData.append('content', testContent)
    
    const createResponse = await fetch('/api/debug-posts', {
      method: 'POST',
      body: createFormData
    })
    
    if (createResponse.ok) {
      const createResult = await createResponse.json()
      console.log('✅ Test post created successfully!')
      console.log('📝 Post ID:', createResult.post?.id)
      console.log('📝 Post content:', createResult.post?.content)
      
      // Verify it appears in the posts list
      console.log('\n5️⃣ Verifying new post appears in list...')
      const verifyResponse = await fetch(`/api/posts?userId=${userId}&t=${Date.now()}`)
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        const foundPost = verifyData.posts?.find(p => p.id === createResult.post.id)
        if (foundPost) {
          console.log('✅ New post found in posts list!')
        } else {
          console.error('❌ New post NOT found in posts list')
        }
      }
      
    } else {
      const createError = await createResponse.text()
      console.error('❌ Test post creation failed:', createError)
    }

    console.log('\n🏁 Database verification complete!')

  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

// Run verification
verifyDatabase()