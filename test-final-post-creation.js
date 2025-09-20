// Final test to verify post creation and visibility fixes
console.log('🎯 Final post creation and visibility test...')

async function finalTest() {
  try {
    // Check session
    const sessionResponse = await fetch('/api/auth/session')
    if (!sessionResponse.ok) {
      console.log('❌ No session - please log in first')
      return
    }
    
    const sessionData = await sessionResponse.json()
    const userId = sessionData.user?.id
    
    if (!userId) {
      console.log('❌ No user ID found')
      return
    }
    
    console.log('✅ Testing as user:', sessionData.user.email)
    
    // Create a text-only post
    console.log('\n📝 Creating text-only post...')
    const textFormData = new FormData()
    textFormData.append('content', `Text-only post created at ${new Date().toLocaleString()} - This should appear in both feed and profile!`)
    textFormData.append('isInvite', 'false')
    
    const textResponse = await fetch('/api/posts', {
      method: 'POST',
      body: textFormData,
    })
    
    if (textResponse.ok) {
      const textResult = await textResponse.json()
      console.log('✅ Text-only post created successfully:', {
        id: textResult.post.id,
        content: textResult.post.content,
        hasVideo: !!textResult.post.video,
        hasImage: !!textResult.post.image
      })
      
      // Wait for processing
      console.log('⏳ Waiting 3 seconds for post processing...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check if it appears in posts API
      console.log('\n🔍 Checking posts API...')
      const postsResponse = await fetch(`/api/posts?userId=${userId}&t=${Date.now()}`)
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        const foundInPosts = postsData.posts?.some(p => p.id === textResult.post.id)
        console.log('Found in posts API:', foundInPosts ? '✅ YES' : '❌ NO')
        
        if (foundInPosts) {
          const ourPost = postsData.posts.find(p => p.id === textResult.post.id)
          console.log('Post details:', {
            id: ourPost.id,
            content: ourPost.content?.substring(0, 100) + '...',
            createdAt: ourPost.createdAt
          })
        }
      }
      
      // Check if it appears in feed API
      console.log('\n🔍 Checking feed API...')
      const feedResponse = await fetch(`/api/feed?limit=20&t=${Date.now()}`)
      if (feedResponse.ok) {
        const feedData = await feedResponse.json()
        const foundInFeed = feedData.posts?.some(p => p.id === textResult.post.id)
        console.log('Found in feed API:', foundInFeed ? '✅ YES' : '❌ NO')
        
        if (foundInFeed) {
          const ourPost = feedData.posts.find(p => p.id === textResult.post.id)
          console.log('Post details:', {
            id: ourPost.id,
            content: ourPost.content?.substring(0, 100) + '...',
            createdAt: ourPost.createdAt
          })
        }
      }
      
      // Trigger refresh events
      console.log('\n🔄 Triggering refresh events...')
      window.dispatchEvent(new CustomEvent('postCreated'))
      window.dispatchEvent(new CustomEvent('feedRefresh'))
      console.log('✅ Events dispatched - check if feed and profile refresh!')
      
      console.log('\n🎉 Test completed! Your text-only post should now be visible in:')
      console.log('   - Feed page (scroll to find it)')
      console.log('   - Your profile page')
      console.log('   - Posts API responses')
      
    } else {
      const errorText = await textResponse.text()
      console.log('❌ Text-only post creation failed:', {
        status: textResponse.status,
        error: errorText
      })
    }
    
  } catch (error) {
    console.error('❌ Final test failed:', error)
  }
}

// Run the test
finalTest()