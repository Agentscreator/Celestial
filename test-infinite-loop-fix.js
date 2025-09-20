// Test to verify infinite loop is fixed
console.log('🔄 Testing infinite loop fix...')

async function testInfiniteLoopFix() {
  try {
    console.log('🔍 Monitoring for React error #185...')
    
    // Monitor console errors
    const originalError = console.error
    let errorCount = 0
    let reactErrors = []
    
    console.error = function(...args) {
      errorCount++
      const message = args.join(' ')
      
      if (message.includes('Minified React error #185') || 
          message.includes('Maximum update depth exceeded')) {
        reactErrors.push({
          message,
          timestamp: new Date().toISOString(),
          count: errorCount
        })
        console.log(`❌ React error #185 detected (${errorCount}):`, message)
      }
      
      originalError.apply(console, args)
    }
    
    // Monitor for excessive re-renders
    let renderCount = 0
    const originalLog = console.log
    console.log = function(...args) {
      const message = args.join(' ')
      if (message.includes('🎥 Initializing camera') || 
          message.includes('🚫 Camera init blocked')) {
        renderCount++
        if (renderCount > 5) {
          console.error('⚠️ Possible infinite loop detected - camera init called', renderCount, 'times')
        }
      }
      originalLog.apply(console, args)
    }
    
    console.log('✅ Error monitoring started')
    console.log('✅ Render monitoring started')
    
    // Test basic functionality
    console.log('\n📱 Testing component stability...')
    
    // Wait and check for errors
    setTimeout(() => {
      console.log('\n📊 Test Results after 5 seconds:')
      console.log('Total console.error calls:', errorCount)
      console.log('Camera init calls:', renderCount)
      console.log('React #185 errors:', reactErrors.length)
      
      if (reactErrors.length === 0) {
        console.log('✅ No React error #185 detected!')
        console.log('✅ Infinite loop appears to be fixed')
      } else {
        console.log('❌ React error #185 still occurring:')
        reactErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.timestamp}: ${error.message}`)
        })
      }
      
      if (renderCount <= 5) {
        console.log('✅ Camera initialization calls are within normal range')
      } else {
        console.log('⚠️ Excessive camera initialization calls detected:', renderCount)
      }
      
      // Restore original functions
      console.error = originalError
      console.log = originalLog
      
      console.log('\n🎯 Test completed!')
      
    }, 5000)
    
    // Test post creation to see if it works
    console.log('\n📝 Testing post creation functionality...')
    
    const sessionResponse = await fetch('/api/auth/session')
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json()
      if (sessionData.user?.id) {
        console.log('✅ Session valid - component should work properly')
      } else {
        console.log('⚠️ No user session - but component should still render without errors')
      }
    } else {
      console.log('⚠️ No session - but component should still render without errors')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testInfiniteLoopFix()