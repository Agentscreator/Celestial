// Debug script to check posts issue
console.log('🔍 Debugging posts visibility issue...')

async function debugPostsIssue() {
  try {
    // 1. Check current session/user
    console.log('\n1️⃣ Checking current session...')
    const sessionResponse = await fetch('/api/auth/session')
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json()
      console.log('Current user:', {
        id: sessionData.user?.id,
        email: sessionData.user?.email,
        username: sessionData.user?.username
      })
      
      if (!sessionData.user?.id) {
        console.log('❌ No user session found')
        return
      }
      
      const userId = sessionData.user.id
      
      // 2. Check posts API for this user
      console.log('\n2️⃣ Checking posts API for current user...')
      const postsResponse = await fetch(`/api/posts?userId=${userId}&t=${Date.now()}`)
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        console.log('Posts API response:', {
          totalPosts: postsData.posts?.length || 0,
          posts: postsData.posts?.map(p => ({
            id: p.id,
            content: p.content?.substring(0, 50) + '...',
            hasImage: !!p.image,
            hasVideo: !!p.video,
            createdAt: p.createdAt,
            userId: p.userId
          })) || []
        })
      } else {
        console.log('❌ Posts API failed:', postsResponse.status)
      }
      
      // 3. Check feed API
      console.log('\n3️⃣ Checking feed API...')
      const feedResponse = await fetch(`/api/feed?limit=20&t=${Date.now()}`)
      
      if (feedResponse.ok) {
        const feedData = await feedResponse.json()
        console.log('Feed API response:', {
          totalPosts: feedData.posts?.length || 0,
          userPosts: feedData.posts?.filter(p => p.user?.id === userId).length || 0,
          posts: feedData.posts?.map(p => ({
            id: p.id,
            content: p.content?.substring(0, 50) + '...',
            hasImage: !!p.image,
            hasVideo: !!p.video,
            createdAt: p.createdAt,
            userId: p.user?.id,
            username: p.user?.username
          })) || []
        })
      } else {
        console.log('❌ Feed API failed:', feedResponse.status)
      }
      
      // 4. Try creating a test post with media
      console.log('\n4️⃣ Testing post creation with media...')
      
      // Create a small test video blob
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'red'
      ctx.fillRect(0, 0, 100, 100)
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          const testFile = new File([blob], 'test-video.webm', { type: 'video/webm' })
          
          const formData = new FormData()
          formData.append('content', 'Test post with media - ' + new Date().toISOString())
          formData.append('media', testFile)
          formData.append('isInvite', 'false')
          
          console.log('Creating test post with media...')
          const createResponse = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
          })
          
          console.log('Create response status:', createResponse.status)
          
          if (createResponse.ok) {
            const createResult = await createResponse.json()
            console.log('✅ Test post created:', {
              id: createResult.post?.id,
              content: createResult.post?.content,
              hasVideo: !!createResult.post?.video,
              hasImage: !!createResult.post?.image
            })
            
            // Wait a moment then check if it appears
            setTimeout(async () => {
              console.log('\n5️⃣ Checking if test post appears in APIs...')
              
              // Check posts API
              const checkPostsResponse = await fetch(`/api/posts?userId=${userId}&t=${Date.now()}`)
              if (checkPostsResponse.ok) {
                const checkPostsData = await checkPostsResponse.json()
                const foundInPosts = checkPostsData.posts?.some(p => p.id === createResult.post.id)
                console.log('Found in posts API:', foundInPosts)
              }
              
              // Check feed API
              const checkFeedResponse = await fetch(`/api/feed?limit=20&t=${Date.now()}`)
              if (checkFeedResponse.ok) {
                const checkFeedData = await checkFeedResponse.json()
                const foundInFeed = checkFeedData.posts?.some(p => p.id === createResult.post.id)
                console.log('Found in feed API:', foundInFeed)
              }
            }, 2000)
            
          } else {
            const errorText = await createResponse.text()
            console.log('❌ Test post creation failed:', {
              status: createResponse.status,
              error: errorText
            })
          }
        }
      }, 'video/webm')
      
    } else {
      console.log('❌ Session check failed:', sessionResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugPostsIssue()