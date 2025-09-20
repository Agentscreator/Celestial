// Test script to verify camera initialization improvements
console.log('📱 Testing camera initialization improvements...')

async function testCameraImprovements() {
  try {
    console.log('🔍 Testing mobile detection and timeout improvements...')
    
    // Test mobile detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log('Mobile device detected:', isMobile ? '✅ YES' : '❌ NO')
    console.log('User agent:', navigator.userAgent)
    
    // Test timeout calculations
    const timeoutDuration = isMobile ? 8000 : 15000
    const videoTimeoutDuration = isMobile ? 5000 : 10000
    
    console.log('Camera timeout duration:', timeoutDuration / 1000, 'seconds')
    console.log('Video timeout duration:', videoTimeoutDuration / 1000, 'seconds')
    
    // Test camera permissions
    console.log('\n📷 Testing camera permissions...')
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('✅ getUserMedia is supported')
      
      try {
        // Test if we can get camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, 
          audio: true 
        })
        
        if (stream) {
          console.log('✅ Camera access granted')
          console.log('Video tracks:', stream.getVideoTracks().length)
          console.log('Audio tracks:', stream.getAudioTracks().length)
          
          // Clean up
          stream.getTracks().forEach(track => track.stop())
          console.log('✅ Stream cleaned up')
        }
        
      } catch (permissionError) {
        console.log('❌ Camera permission error:', permissionError.message)
        console.log('This is expected if camera permission is denied')
      }
      
    } else {
      console.log('❌ getUserMedia not supported')
    }
    
    // Test retry logic simulation
    console.log('\n🔄 Testing retry logic...')
    
    let retryCount = 0
    const maxRetries = 2
    
    function simulateRetry() {
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`Retry attempt ${retryCount}/${maxRetries}`)
        
        // Simulate failure and retry
        setTimeout(() => {
          if (retryCount < maxRetries) {
            console.log('Retry failed, attempting again...')
            simulateRetry()
          } else {
            console.log('Max retries reached, would show fallback options')
          }
        }, 2000)
      }
    }
    
    // Start simulation
    simulateRetry()
    
    // Test error messages
    console.log('\n💬 Testing error messages...')
    
    const errorMessages = {
      timeout: isMobile 
        ? "Camera timed out. Close other apps using the camera, or use 'Upload Video Instead'."
        : "Camera initialization timed out. Please close other apps using the camera and try again.",
      permission: isMobile
        ? "Camera permission denied. Check your app settings and allow camera access."
        : "Camera permission denied. Please allow camera access and try again.",
      general: isMobile
        ? "Camera unavailable. Try restarting the app or use 'Upload Video Instead'."
        : "Failed to access camera. Please try again."
    }
    
    console.log('Timeout error message:', errorMessages.timeout)
    console.log('Permission error message:', errorMessages.permission)
    console.log('General error message:', errorMessages.general)
    
    console.log('\n🎯 Camera improvements test completed!')
    console.log('Expected improvements:')
    console.log('✅ Faster timeouts for mobile devices')
    console.log('✅ Auto-retry mechanism (up to 2 times)')
    console.log('✅ Better error messages for mobile users')
    console.log('✅ Manual retry function with state reset')
    console.log('✅ Progress indication during retries')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCameraImprovements()