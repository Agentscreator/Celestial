// Comprehensive diagnostic script for post saving issues
console.log('🔍 Starting post saving diagnostic...')

async function diagnosePosts() {
  try {
    // 1. Check if user is authenticated
    console.log('\n1️⃣ Checking authentication...')
    const sessionResponse = await fetch('/api/auth/session')
    if (!sessionResponse.ok) {
      console.error('❌ Session check failed:', sessionResponse.status)
      return
    }
    
    const session = await sessionResponse.json()
    if (!session?.user?.id) {
      console.error('❌ No authenticated user found')
      return
    }
    
    console.log('✅ User authenticated:', session.user.email)
    const userId = session.user.id
    
    // 2. Test database connection
    console.log('\n2️⃣ Testing database connection...')
    const dbTestResponse = await fetch('/api/test-db')
    if (dbTestResponse.ok) {
      const dbResult = await dbTestResponse.json()
      console.log('✅ Database connection:', dbResult.status)
    } else {
      console.error('❌ Database connection failed:', dbTestResponse.status)
    }
    
    // 3. Test simple post creation (debug endpoint)
    console.log('\n3️⃣ Testing simple post creation...')
    const debugFormData = new FormData()
    debugFormData.append('content', 'Debug test post - ' + new Date().toISOString())
    
    const debugResponse = await fetch('/api/debug-posts', {
      method: 'POST',
      body: debugFormData
    })
    
    console.log('Debug post response:', debugResponse.status)
    if (debugResponse.ok) {
      const debugResult = await debugResponse.json()
      console.log('✅ Simple post creation works:', debugResult.post?.id)
    } else {
      const debugError = await debugResponse.text()
      console.error('❌ Simple post creation failed:', debugError)
    }
    
    // 4. Test main posts API with minimal data
    console.log('\n4️⃣ Testing main posts API...')
    const mainFormData = new FormData()
    mainFormData.append('content', 'Main API test post - ' + new Date().toISOString())
    mainFormData.append('isInvite', 'false')
    
    const mainResponse = await fetch('/api/posts', {
      method: 'POST',
      body: mainFormData
    })
    
    console.log('Main API response:', mainResponse.status)
    if (mainResponse.ok) {
      const mainResult = await mainResponse.json()
      console.log('✅ Main API post creation works:', mainResult.post?.id)
    } else {
      const mainError = await mainResponse.text()
      console.error('❌ Main API post creation failed:', mainError)
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(mainError)
        console.error('Error details:', errorJson)
      } catch (e) {
        console.error('Raw error:', mainError.substring(0, 500))
      }
    }
    
    // 5. Check if posts are being saved but not retrieved
    console.log('\n5️⃣ Checking post retrieval...')
    const postsResponse = await fetch(`/api/posts?userId=${userId}&t=${Date.now()}`)
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      console.log('✅ Posts retrieved:', postsData.posts?.length || 0)
      
      if (postsData.posts?.length > 0) {
        const latestPost = postsData.posts[0]
        console.log('Latest post:', {
          id: latestPost.id,
          content: latestPost.content?.substring(0, 50),
          createdAt: latestPost.createdAt,
          userId: latestPost.userId
        })
      }
    } else {
      console.error('❌ Posts retrieval failed:', postsResponse.status)
    }
    
    // 6. Test with media (small test image)
    console.log('\n6️⃣ Testing with media...')
    try {
      // Create a small test image
      const canvas = document.createElement('canvas')
      canvas.width = 10
      canvas.height = 10
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, 10, 10)
      
      const testBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png')
      })
      
      const testFile = new File([testBlob], 'test.png', { type: 'image/png' })
      
      const mediaFormData = new FormData()
      mediaFormData.append('content', 'Media test post - ' + new Date().toISOString())
      mediaFormData.append('media', testFile)
      mediaFormData.append('isInvite', 'false')
      
      const mediaResponse = await fetch('/api/posts', {
        method: 'POST',
        body: mediaFormData
      })
      
      console.log('Media post response:', mediaResponse.status)
      if (mediaResponse.ok) {
        const mediaResult = await mediaResponse.json()
        console.log('✅ Media post creation works:', mediaResult.post?.id)
        console.log('Media URL:', mediaResult.post?.image || mediaResult.post?.video)
      } else {
        const mediaError = await mediaResponse.text()
        console.error('❌ Media post creation failed:', mediaError.substring(0, 500))
      }
    } catch (mediaError) {
      console.error('❌ Media test setup failed:', mediaError)
    }
    
    // 7. Check environment variables
    console.log('\n7️⃣ Checking environment...')
    console.log('Current URL:', window.location.origin)
    console.log('User agent:', navigator.userAgent.substring(0, 100))
    
    console.log('\n🏁 Diagnostic complete!')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
  }
}

// Run diagnostic
diagnosePosts()