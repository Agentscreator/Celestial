// Test the fixed post creation
const testFixedPostCreation = async () => {
  console.log('🧪 Testing fixed post creation...')
  
  try {
    // Test 1: Content-only post
    console.log('\n1️⃣ Testing content-only post...')
    const formData1 = new FormData()
    formData1.append('content', 'Test content-only post ' + Date.now())
    formData1.append('isInvite', 'false')
    
    const response1 = await fetch('/api/posts', {
      method: 'POST',
      body: formData1,
    })
    
    if (response1.ok) {
      const result1 = await response1.json()
      console.log('✅ Content-only post created:', result1.post.id)
    } else {
      const error1 = await response1.text()
      console.error('❌ Content-only post failed:', error1)
    }
    
    // Test 2: Empty content (should fail)
    console.log('\n2️⃣ Testing empty content (should fail)...')
    const formData2 = new FormData()
    formData2.append('content', '')
    formData2.append('isInvite', 'false')
    
    const response2 = await fetch('/api/posts', {
      method: 'POST',
      body: formData2,
    })
    
    if (response2.ok) {
      console.log('⚠️ Empty content post unexpectedly succeeded')
    } else {
      const error2 = await response2.text()
      console.log('✅ Empty content correctly rejected:', error2)
    }
    
    // Test 3: Debug endpoint
    console.log('\n3️⃣ Testing debug endpoint...')
    const formData3 = new FormData()
    formData3.append('content', 'Debug test post ' + Date.now())
    
    const response3 = await fetch('/api/debug-posts', {
      method: 'POST',
      body: formData3,
    })
    
    if (response3.ok) {
      const result3 = await response3.json()
      console.log('✅ Debug endpoint works:', result3.post.id)
    } else {
      const error3 = await response3.text()
      console.error('❌ Debug endpoint failed:', error3)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
  
  console.log('\n🏁 Test complete!')
}

// Auto-run the test
testFixedPostCreation()