// Debug Camera Issue
// Run this in browser console to test camera functionality

console.log('🔍 Camera Debug Tool Started')

// Test camera permissions
async function testCameraPermissions() {
  console.log('📹 Testing camera permissions...')
  
  try {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not supported')
      return false
    }
    
    // Try to get camera stream
    console.log('📱 Requesting camera stream...')
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true
    })
    
    console.log('✅ Camera stream obtained:', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      active: stream.active
    })
    
    // Clean up
    stream.getTracks().forEach(track => {
      track.stop()
      console.log('🛑 Stopped track:', track.kind)
    })
    
    return true
  } catch (error) {
    console.error('❌ Camera permission test failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      constraint: error.constraint
    })
    return false
  }
}

// Test camera availability
async function testCameraAvailability() {
  console.log('📷 Testing camera availability...')
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    
    console.log('📱 Available video devices:', videoDevices.length)
    videoDevices.forEach((device, index) => {
      console.log(`- Device ${index + 1}:`, {
        deviceId: device.deviceId.substring(0, 20) + '...',
        label: device.label || 'Unknown Camera',
        groupId: device.groupId
      })
    })
    
    return videoDevices.length > 0
  } catch (error) {
    console.error('❌ Device enumeration failed:', error)
    return false
  }
}

// Check current camera state in the app
function checkAppCameraState() {
  console.log('🎬 Checking app camera state...')
  
  // Look for video elements
  const videos = document.querySelectorAll('video')
  console.log('📺 Video elements found:', videos.length)
  
  videos.forEach((video, index) => {
    console.log(`Video ${index + 1}:`, {
      src: video.src || 'No src',
      srcObject: !!video.srcObject,
      readyState: video.readyState,
      paused: video.paused,
      muted: video.muted
    })
  })
  
  // Check for camera permission status
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'camera' }).then(result => {
      console.log('📹 Camera permission status:', result.state)
    }).catch(err => {
      console.log('❌ Could not check camera permission:', err)
    })
  }
}

// Run all tests
async function runCameraDebug() {
  console.log('🚀 Running comprehensive camera debug...')
  
  const permissionsOk = await testCameraPermissions()
  const availabilityOk = await testCameraAvailability()
  checkAppCameraState()
  
  console.log('\n📊 Camera Debug Results:')
  console.log('- Permissions:', permissionsOk ? '✅' : '❌')
  console.log('- Availability:', availabilityOk ? '✅' : '❌')
  
  if (permissionsOk && availabilityOk) {
    console.log('\n🎉 Camera should be working!')
    console.log('If you\'re still having issues, try:')
    console.log('1. Close other apps using the camera')
    console.log('2. Refresh the page')
    console.log('3. Check browser permissions')
  } else {
    console.log('\n⚠️ Camera issues detected. Check the logs above.')
  }
}

// Auto-run the debug
runCameraDebug()