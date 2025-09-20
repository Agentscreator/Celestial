// Post Button Debug Test
// This script helps debug why the post button isn't working

console.log('🔍 Post Button Debug Test Started')

// Test the post creation endpoint directly
async function testPostCreation() {
  console.log('📝 Testing post creation...')
  
  try {
    // Test with text-only post first
    const formData = new FormData()
    formData.append('content', 'Test post from debug script')
    formData.append('isInvite', 'false')
    
    console.log('📤 Sending test post request...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Post creation successful:', data)
    } else {
      const errorText = await response.text()
      console.error('❌ Post creation failed:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Test authentication
async function testAuth() {
  console.log('🔐 Testing authentication...')
  
  try {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    
    if (session?.user) {
      console.log('✅ User authenticated:', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      })
      return true
    } else {
      console.error('❌ User not authenticated')
      return false
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    return false
  }
}

// Main debug function
async function debugPostButton() {
  console.log('🚀 Starting post button debug...')
  
  // Check if we're authenticated
  const isAuthenticated = await testAuth()
  if (!isAuthenticated) {
    console.error('❌ Cannot test post creation - user not authenticated')
    return
  }
  
  // Test post creation
  await testPostCreation()
  
  console.log('🏁 Debug test completed')
}

// Run the debug test
debugPostButton()