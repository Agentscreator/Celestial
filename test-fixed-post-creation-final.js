// Final test for the fixed post creation
const testFixedPostCreationFinal = async () => {
  console.log('🧪 Testing FIXED post creation...')
  
  try {
    // Test the scenario that was likely causing the internal server error
    console.log('\n🎯 Testing post with community creation (previously failing)...')
    
    const formData = new FormData()
    formData.append('content', 'Community test post ' + Date.now())
    formData.append('isInvite', 'true')
    formData.append('inviteDescription', 'Join our awesome community!')
    formData.append('inviteLimit', '10')
    formData.append('groupName', 'Test Community ' + Date.now())
    
    console.log('📤 Sending request...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ SUCCESS! Post with community created:', {
        postId: result.post.id,
        content: result.post.content,
        message: result.message
      })
      
      // Verify the post was actually created by fetching it
      console.log('\n🔍 Verifying post exists...')
      const verifyResponse = await fetch(`/api/posts/${result.post.id}`)
      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json()
        console.log('✅ Post verification successful:', verifyResult.post.id)
      } else {
        console.error('❌ Post verification failed')
      }
      
    } else {
      const errorText = await response.text()
      console.error('❌ STILL FAILING:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.error('Parsed error:', errorJson)
      } catch (e) {
        console.error('Raw error text:', errorText)
      }
    }
    
  } catch (error) {
    console.error('❌ Network/JS error:', error)
  }
  
  console.log('\n🏁 Final test complete!')
}

// Auto-run the test
testFixedPostCreationFinal()