// Test script to debug post creation issue
console.log('🧪 Starting post creation debug test...')

async function testPostCreation() {
  try {
    // Test 1: Create a simple text post
    console.log('\n1️⃣ Testing simple text post creation...')
    const formData1 = new FormData()
    formData1.append('content', 'Test post from debug script - ' + new Date().toISOString())
    formData1.append('isInvite', 'false')
    
    const response1 = await fetch('/api/posts', {
      method: 'POST',
      body: formData1,
    })
    
    console.log('Text post response status:', response1.status)
    console.log('Text post response headers:', Object.fromEntries(response1.headers.entries()))
    
    if (response1.ok) {
      const result1 = await response1.json()
      console.log('✅ Text post created successfully:', {
        id: result1.post?.id,
        userId: result1.post?.userId,
        content: result1.post?.content,
        createdAt: result1.post?.createdAt
      })
      
      // Test 2: Verify the post appears in the API
      console.log('\n2️⃣ Verifying post appears in posts API...')
      const verifyResponse = await fetch(`/api/posts?userId=${result1.post.userId}&t=${Date.now()}`)
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        console.log('Posts API response:', {
          totalPosts: verifyData.posts?.length || 0,
          foundOurPost: verifyData.posts?.some(p => p.id === result1.post.id) || false
        })
        
        if (verifyData.posts?.some(p => p.id === result1.post.id)) {
          console.log('✅ Post found in posts API!')
        } else {
          console.log('❌ Post NOT found in posts API!')
          console.log('Available posts:', verifyData.posts?.map(p => ({
            id: p.id,
            content: p.content?.substring(0, 50),
            createdAt: p.createdAt
          })))
        }
      } else {
        console.log('❌ Failed to verify post in posts API:', verifyResponse.status)
      }
      
      // Test 3: Check feed API
      console.log('\n3️⃣ Checking feed API...')
      const feedResponse = await fetch('/api/feed?limit=10&t=' + Date.now())
      
      if (feedResponse.ok) {
        const feedData = await feedResponse.json()
        console.log('Feed API response:', {
          totalPosts: feedData.posts?.length || 0,
          foundOurPost: feedData.posts?.some(p => p.id === result1.post.id) || false
        })
        
        if (feedData.posts?.some(p => p.id === result1.post.id)) {
          console.log('✅ Post found in feed API!')
        } else {
          console.log('❌ Post NOT found in feed API!')
          console.log('Feed posts:', feedData.posts?.map(p => ({
            id: p.id,
            content: p.content?.substring(0, 50),
            hasVideo: !!p.video,
            hasImage: !!p.image,
            createdAt: p.createdAt
          })))
        }
      } else {
        console.log('❌ Failed to check feed API:', feedResponse.status)
      }
      
    } else {
      const errorText = await response1.text()
      console.log('❌ Text post creation failed:', {
        status: response1.status,
        statusText: response1.statusText,
        error: errorText
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPostCreation()