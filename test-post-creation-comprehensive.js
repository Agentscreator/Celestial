// Comprehensive test for post creation fixes
console.log('🧪 Starting comprehensive post creation test...')

async function runComprehensiveTest() {
  try {
    // Get current user
    const sessionResponse = await fetch('/api/auth/session')
    if (!sessionResponse.ok) {
      console.log('❌ No session found')
      return
    }
    
    const sessionData = await sessionResponse.json()
    const userId = sessionData.user?.id
    
    if (!userId) {
      console.log('❌ No user ID found')
      return
    }
    
    console.log('✅ Current user:', sessionData.user.email)
    
    // Test 1: Text-only post
    console.log('\n1️⃣ Testing text-only post...')
    const textFormData = new FormData()
    textFormData.append('content', 'Text-only post test - ' + new Date().toISOString())
    textFormData.append('isInvite', 'false')
    
    const textResponse = await fetch('/api/posts', {
      method: 'POST',
      body: textFormData,
    })
    
    console.log('Text post response:', textResponse.status)
    
    let textPostId = null
    if (textResponse.ok) {
      const textResult = await textResponse.json()
      textPostId = textResult.post?.id
      console.log('✅ Text-only post created:', textPostId)
    } else {
      const errorText = await textResponse.text()
      console.log('❌ Text-only post failed:', errorText)
    }
    
    // Test 2: Media post (create a small test image)
    console.log('\n2️⃣ Testing media post...')
    
    // Create a small test image
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.fillText('TEST', 25, 55)
    
    // Convert to blob
    const testBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })
    
    const testFile = new File([testBlob], 'test-image.png', { type: 'image/png' })
    
    const mediaFormData = new FormData()
    mediaFormData.append('content', 'Media post test - ' + new Date().toISOString())
    mediaFormData.append('media', testFile)
    mediaFormData.append('isInvite', 'false')
    
    const mediaResponse = await fetch('/api/posts', {
      method: 'POST',
      body: mediaFormData,
    })
    
    console.log('Media post response:', mediaResponse.status)
    
    let mediaPostId = null
    if (mediaResponse.ok) {
      const mediaResult = await mediaResponse.json()
      mediaPostId = mediaResult.post?.id
      console.log('✅ Media post created:', mediaPostId)
    } else {
      const errorText = await mediaResponse.text()
      console.log('❌ Media post failed:', errorText)
    }
    
    // Wait for posts to be processed
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Test 3: Check posts API
    console.log('\n3️⃣ Checking posts API...')
    const postsResponse = await fetch(`/api/posts?userId=${userId}&t=${Date.now()}`)
    
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      console.log('Posts API total:', postsData.posts?.length || 0)
      
      if (textPostId) {
        const foundText = postsData.posts?.some(p => p.id === textPostId)
        console.log('Text post found in posts API:', foundText)
      }
      
      if (mediaPostId) {
        const foundMedia = postsData.posts?.some(p => p.id === mediaPostId)
        console.log('Media post found in posts API:', foundMedia)
      }
      
      // Show recent posts
      const recentPosts = postsData.posts?.slice(0, 5).map(p => ({
        id: p.id,
        content: p.content?.substring(0, 50) + '...',
        hasImage: !!p.image,
        hasVideo: !!p.video,
        createdAt: p.createdAt
      }))
      console.log('Recent posts:', recentPosts)
    } else {
      console.log('❌ Posts API failed:', postsResponse.status)
    }
    
    // Test 4: Check feed API
    console.log('\n4️⃣ Checking feed API...')
    const feedResponse = await fetch(`/api/feed?limit=20&t=${Date.now()}`)
    
    if (feedResponse.ok) {
      const feedData = await feedResponse.json()
      console.log('Feed API total:', feedData.posts?.length || 0)
      
      if (textPostId) {
        const foundText = feedData.posts?.some(p => p.id === textPostId)
        console.log('Text post found in feed API:', foundText)
      }
      
      if (mediaPostId) {
        const foundMedia = feedData.posts?.some(p => p.id === mediaPostId)
        console.log('Media post found in feed API:', foundMedia)
      }
      
      // Show recent posts
      const recentPosts = feedData.posts?.slice(0, 5).map(p => ({
        id: p.id,
        content: p.content?.substring(0, 50) + '...',
        hasImage: !!p.image,
        hasVideo: !!p.video,
        createdAt: p.createdAt,
        username: p.user?.username
      }))
      console.log('Recent feed posts:', recentPosts)
    } else {
      console.log('❌ Feed API failed:', feedResponse.status)
    }
    
    // Test 5: Trigger refresh events
    console.log('\n5️⃣ Triggering refresh events...')
    window.dispatchEvent(new CustomEvent('postCreated'))
    window.dispatchEvent(new CustomEvent('feedRefresh'))
    console.log('✅ Refresh events dispatched')
    
    console.log('\n🎉 Comprehensive test completed!')
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error)
  }
}

// Run the test
runComprehensiveTest()