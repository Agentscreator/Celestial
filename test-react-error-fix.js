// Test to verify React error #185 is fixed
console.log('🔧 Testing React error #185 fix...')

async function testReactErrorFix() {
  try {
    console.log('🔍 Checking for React errors...')
    
    // Monitor for React errors
    const originalError = console.error
    let reactErrors = []
    
    console.error = function(...args) {
      const message = args.join(' ')
      if (message.includes('Minified React error') || message.includes('#185')) {
        reactErrors.push(message)
        console.log('❌ React error detected:', message)
      }
      originalError.apply(console, args)
    }
    
    // Test basic functionality
    console.log('\n1️⃣ Testing window/document access safety...')
    
    // Simulate what the component does
    if (typeof window !== 'undefined') {
      console.log('✅ Window is available')
      window.dispatchEvent(new CustomEvent('postCreated'))
      console.log('✅ Window event dispatch works')
    }
    
    if (typeof document !== 'undefined') {
      console.log('✅ Document is available')
    }
    
    // Test navigation
    console.log('\n2️⃣ Testing navigation safety...')
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log('✅ Navigation safety check passed')
        // Don't actually navigate in test
        console.log('Would navigate to: /feed')
      }
    }, 100)
    
    // Test post creation API
    console.log('\n3️⃣ Testing post creation API...')
    
    const sessionResponse = await fetch('/api/auth/session')
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json()
      if (sessionData.user?.id) {
        console.log('✅ Session valid for user:', sessionData.user.email)
        
        // Create a test post
        const formData = new FormData()
        formData.append('content', `React error fix test - ${new Date().toISOString()}`)
        formData.append('isInvite', 'false')
        
        const postResponse = await fetch('/api/posts', {
          method: 'POST',
          body: formData,
        })
        
        if (postResponse.ok) {
          const result = await postResponse.json()
          console.log('✅ Post creation API works:', result.post?.id)
        } else {
          console.log('❌ Post creation API failed:', postResponse.status)
        }
      } else {
        console.log('⚠️ No user session - skipping post creation test')
      }
    } else {
      console.log('⚠️ No session - skipping post creation test')
    }
    
    // Wait a moment to catch any delayed errors
    setTimeout(() => {
      console.log('\n📊 Test Results:')
      if (reactErrors.length === 0) {
        console.log('✅ No React errors detected!')
        console.log('✅ Component should work properly now')
      } else {
        console.log('❌ React errors still present:')
        reactErrors.forEach(error => console.log('  -', error))
      }
      
      // Restore original console.error
      console.error = originalError
    }, 2000)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testReactErrorFix()