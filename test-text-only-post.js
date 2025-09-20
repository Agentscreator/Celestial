// Test script to verify text-only posts work
console.log('🧪 Testing text-only post creation...')

async function testTextOnlyPost() {
  try {
    console.log('\n1️⃣ Creating text-only post...')
    const formData = new FormData()
    formData.append('content', 'This is a text-only post created at ' + new Date().toISOString())
    formData.append('isInvite', 'false')
    
    console.log('FormData contents:')
    for (const [key, value] of formData.entries()) {
      console.log(`- ${key}: ${value}`)
    }
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Text-only post created successfully:', {
        id: result.post?.id,
        userId: result.post?.userId,
        content: result.post?.content,
        hasImage: !!result.post?.image,
        hasVideo: !!result.post?.video,
        createdAt: result.post?.createdAt
      })
      
      // Wait a moment then check if it appears in APIs
      setTimeout(async () => {
        console.log('\n2️⃣ Checking if post appears in APIs...')
        
        // Check posts API
        const postsResponse = await fetch(`/api/posts?userId=${result.post.userId}&t=${Date.now()}`)
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const foundInPosts = postsData.posts?.some(p => p.id === result.post.id)
          console.log('Found in posts API:', foundInPosts)
          
          if (foundInPosts) {
            const ourPost = postsData.posts.find(p => p.id === result.post.id)
            console.log('Post details in posts API:', {
              id: ourPost.id,
              content: ourPost.content,
              hasImage: !!ourPost.image,
              hasVideo: !!ourPost.video
            })
          }
        }
        
        // Check feed API
        const feedResponse = await fetch(`/api/feed?limit=20&t=${Date.now()}`)
        if (feedResponse.ok) {
          const feedData = await feedResponse.json()
          const foundInFeed = feedData.posts?.some(p => p.id === result.post.id)
          console.log('Found in feed API:', foundInFeed)
          
          if (foundInFeed) {
            const ourPost = feedData.posts.find(p => p.id === result.post.id)
            console.log('Post details in feed API:', {
              id: ourPost.id,
              content: ourPost.content,
              hasImage: !!ourPost.image,
              hasVideo: !!ourPost.video
            })
          }
        }
        
        // Trigger refresh events
        console.log('\n3️⃣ Triggering refresh events...')
        window.dispatchEvent(new CustomEvent('postCreated'))
        window.dispatchEvent(new CustomEvent('feedRefresh'))
        console.log('✅ Refresh events dispatched')
        
      }, 2000)
      
    } else {
      const errorText = await response.text()
      console.log('❌ Text-only post creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testTextOnlyPost()