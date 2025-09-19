// Simple test to verify post creation API
async function testPostCreation() {
  console.log('🧪 Testing post creation API...')
  
  try {
    // Create a simple test FormData
    const formData = new FormData()
    formData.append('content', 'Test post from debugging script')
    formData.append('isInvite', 'false')
    
    console.log('📤 Sending test request...')
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Test post creation successful:', result)
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Test post creation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      })
      return false
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    return false
  }
}

// Test session
async function testSession() {
  console.log('🔐 Testing session...')
  
  try {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    
    console.log('Session data:', session)
    
    if (session?.user?.id) {
      console.log('✅ User is authenticated:', session.user.id)
      return true
    } else {
      console.log('❌ User is not authenticated')
      return false
    }
  } catch (error) {
    console.error('❌ Session test error:', error)
    return false
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting post button debugging tests...')
  
  const hasSession = await testSession()
  if (!hasSession) {
    console.log('❌ Cannot test post creation without authentication')
    return
  }
  
  const postWorking = await testPostCreation()
  
  console.log('📊 Test Results:')
  console.log('- Session:', hasSession ? '✅ Working' : '❌ Failed')
  console.log('- Post API:', postWorking ? '✅ Working' : '❌ Failed')
  
  if (hasSession && postWorking) {
    console.log('🎉 Post button should be working! Check the UI validation.')
  } else {
    console.log('🔧 Issues found that need to be fixed.')
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.testPostButton = runTests
  console.log('💡 Run window.testPostButton() in the browser console to test')
}

// Run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPostCreation, testSession, runTests }
}