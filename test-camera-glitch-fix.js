// Test Camera Glitch Fix
// Run this in browser console to monitor camera initialization

console.log('🔍 Camera Glitch Debug Tool Started')

// Monitor camera state changes
let lastCameraState = null

function monitorCameraState() {
  // Look for video elements
  const videos = document.querySelectorAll('video')
  const currentState = {
    videoCount: videos.length,
    videoStates: Array.from(videos).map((video, index) => ({
      index,
      src: video.src ? 'Has src' : 'No src',
      srcObject: video.srcObject ? 'Has stream' : 'No stream',
      readyState: video.readyState,
      paused: video.paused,
      muted: video.muted,
      width: video.videoWidth,
      height: video.videoHeight
    }))
  }
  
  // Only log if state changed
  const stateString = JSON.stringify(currentState)
  if (stateString !== lastCameraState) {
    console.log('📹 Camera state changed:', currentState)
    lastCameraState = stateString
    
    // Check for glitching (video appears then disappears)
    videos.forEach((video, index) => {
      if (video.srcObject && video.readyState === 0) {
        console.warn('⚠️ Potential glitch detected: Video has stream but readyState is 0')
      }
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.paused) {
        console.warn('⚠️ Video has dimensions but is paused')
      }
    })
  }
}

// Monitor every 500ms
const monitorInterval = setInterval(monitorCameraState, 500)

// Stop monitoring after 30 seconds
setTimeout(() => {
  clearInterval(monitorInterval)
  console.log('🏁 Camera monitoring stopped')
}, 30000)

// Test camera permissions immediately
async function quickCameraTest() {
  try {
    console.log('🧪 Quick camera test...')
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true
    })
    
    console.log('✅ Camera access successful:', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      active: stream.active
    })
    
    // Stop immediately
    stream.getTracks().forEach(track => track.stop())
    console.log('🛑 Test stream stopped')
    
  } catch (error) {
    console.error('❌ Camera test failed:', error)
  }
}

// Run quick test
quickCameraTest()

console.log('🎯 Monitoring camera for 30 seconds...')
console.log('💡 Try switching between camera and preview modes to test for glitching')