// Test Post Button Fixes
// Run this in browser console to test the fixes

console.log('🧪 Testing Post Button Fixes...')

// Test 1: Check if we can create a simple text post
async function testSimpleTextPost() {
  console.log('📝 Testing simple text post...')
  
  try {
    const formData = new FormData()
    formData.append('content', 'Test post from fix verification')
    formData.append('isInvite', 'false')
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Text post created successfully!')
      console.log('Post ID:', result.post?.id)
      console.log('Content:', result.post?.content)
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Text post failed:', response.status, errorText)
      return false
    }
  } catch (error) {
    console.error('❌ Text post error:', error)
    return false
  }
}

// Test 2: Check authentication
async function checkAuth() {
  console.log('🔐 Checking authentication...')
  
  try {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    
    if (session?.user) {
      console.log('✅ Authenticated as:', session.user.email || session.user.name)
      return true
    } else {
      console.error('❌ Not authenticated')
      return false
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    return false
  }
}

// Test 3: Check if NewPostCreator component is available
function checkComponent() {
  console.log('🔍 Checking if NewPostCreator is available...')
  
  // Look for the component in the DOM
  const postCreator = document.querySelector('[data-testid="new-post-creator"]') || 
                     document.querySelector('.fullscreen-dialog') ||
                     document.querySelector('[role="dialog"]')
  
  if (postCreator) {
    console.log('✅ Found post creator component')
    return true
  } else {
    console.log('❌ Post creator component not found in DOM')
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive test...')
  
  const authOk = await checkAuth()
  if (!authOk) {
    console.log('❌ Cannot proceed - authentication required')
    return
  }
  
  const componentOk = checkComponent()
  const textPostOk = await testSimpleTextPost()
  
  console.log('\n📊 Test Results:')
  console.log('- Authentication:', authOk ? '✅' : '❌')
  console.log('- Component Available:', componentOk ? '✅' : '❌')
  console.log('- Text Post Creation:', textPostOk ? '✅' : '❌')
  
  if (authOk && textPostOk) {
    console.log('\n🎉 Basic functionality is working!')
    console.log('Try creating a post through the UI now.')
  } else {
    console.log('\n⚠️ Some issues detected. Check the logs above.')
  }
}

// Auto-run the tests
runAllTests()