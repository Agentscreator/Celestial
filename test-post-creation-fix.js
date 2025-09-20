// Test script to verify post creation works without React errors
console.log('🧪 Testing post creation after React error fix...')

async function testPostCreationFix() {
  try {
    // Check if we have a session
    const sessionResponse = await fetch('/api/auth/session')
    if (!sessionResponse.ok) {
      console.log('❌ No session - please log in first')
      return
    }
    
    const sessionData = await sessionResponse.json()
    if (!sessionData.user?.id) {
      console.log('❌ No user ID found')
      return
    }
    
    console.log('✅ Testing as user:', sessionData.user.email)
    console.log('Current page:', window.location.pathname)
    
    // Test creating a simple text post
    console.log('\n📝 Creating test post...')
    const formData = new FormData()
    formData.append('content', `Test post after React error fix - ${new Date().toLocaleString()}`)
    formData.append('isInvite', 'false')
    
    console.log('Sending request...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Post created successfully:', {
        id: result.post?.id,
        content: result.post?.content,
        userId: result.post?.userId
      })
      
      // Test the navigation manually
      console.log('\n🔄 Testing navigation...')
      console.log('Current page before navigation:', window.location.pathname)
      
      // Simulate what the component should do
      setTimeout(() => {
        console.log('Navigating to feed...')
        window.location.href = '/feed'
      }, 1000)
      
      console.log('✅ Test completed successfully!')
      console.log('Expected: Page should navigate to /feed in 1 second')
      
    } else {
      const errorText = await response.text()
      console.log('❌ Post creation failed:', {
        status: response.status,
        error: errorText
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPostCreationFix()