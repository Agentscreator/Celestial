// Debug script to identify the media upload issue
// Run this in your browser console while on your app

console.log('🔍 DEBUGGING MEDIA UPLOAD ISSUE')

// Test 1: Check if we can create a simple post without media
const testTextPost = async () => {
  console.log('\n1️⃣ Testing text-only post...')
  
  const formData = new FormData()
  formData.append('content', 'Debug text post ' + Date.now())
  formData.append('isInvite', 'false')
  
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Text post successful:', result.post.id)
      return true
    } else {
      console.error('❌ Text post failed:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ Text post error:', error)
    return false
  }
}

// Test 2: Check if we can create a post with a tiny media file
const testTinyMediaPost = async () => {
  console.log('\n2️⃣ Testing tiny media post...')
  
  // Create the smallest possible "video" file
  const tinyContent = 'x' // Just one character
  const blob = new Blob([tinyContent], { type: 'video/mp4' })
  const file = new File([blob], 'tiny.mp4', { type: 'video/mp4' })
  
  console.log('Tiny file details:', {
    name: file.name,
    size: file.size,
    type: file.type
  })
  
  const formData = new FormData()
  formData.append('content', 'Debug tiny media post ' + Date.now())
  formData.append('media', file)
  formData.append('isInvite', 'false')
  
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Tiny media post successful!')
      console.log('Post details:', {
        id: result.post.id,
        content: result.post.content,
        image: result.post.image,
        video: result.post.video,
        hasMedia: !!(result.post.image || result.post.video)
      })
      
      if (result.post.video || result.post.image) {
        console.log('🎉 MEDIA URL WAS CREATED! The issue might be with larger files.')
        return { success: true, mediaUrl: result.post.video || result.post.image }
      } else {
        console.log('❌ NO MEDIA URL - The issue is in the upload process')
        return { success: false, reason: 'no_media_url' }
      }
    } else {
      const errorText = await response.text()
      console.error('❌ Tiny media post failed:', errorText.substring(0, 200))
      return { success: false, reason: 'api_error', error: errorText }
    }
  } catch (error) {
    console.error('❌ Tiny media post error:', error)
    return { success: false, reason: 'network_error', error: error.message }
  }
}

// Test 3: Check what happens with a recorded video blob
const testRecordedVideoBlob = async () => {
  console.log('\n3️⃣ Testing recorded video blob...')
  
  try {
    // Get user media to create a real video blob
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 320, height: 240 }, 
      audio: true 
    })
    
    console.log('Got media stream, creating recorder...')
    
    const mediaRecorder = new MediaRecorder(stream)
    const chunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    
    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating blob...')
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], 'recorded-test.webm', { type: 'video/webm' })
        
        console.log('Recorded file details:', {
          name: file.name,
          size: file.size,
          type: file.type
        })
        
        if (file.size === 0) {
          console.log('❌ Recorded file is empty!')
          resolve({ success: false, reason: 'empty_recording' })
          return
        }
        
        // Try to upload this recorded file
        const formData = new FormData()
        formData.append('content', 'Debug recorded video post ' + Date.now())
        formData.append('media', file)
        formData.append('isInvite', 'false')
        
        try {
          const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
          })
          
          console.log('Recorded video response status:', response.status)
          
          if (response.ok) {
            const result = await response.json()
            console.log('✅ Recorded video post successful!')
            console.log('Post details:', {
              id: result.post.id,
              content: result.post.content,
              image: result.post.image,
              video: result.post.video,
              hasMedia: !!(result.post.image || result.post.video)
            })
            
            if (result.post.video || result.post.image) {
              console.log('🎉 RECORDED VIDEO UPLOAD WORKS!')
              resolve({ success: true, mediaUrl: result.post.video || result.post.image })
            } else {
              console.log('❌ NO MEDIA URL FOR RECORDED VIDEO')
              resolve({ success: false, reason: 'no_media_url_recorded' })
            }
          } else {
            const errorText = await response.text()
            console.error('❌ Recorded video post failed:', errorText.substring(0, 200))
            resolve({ success: false, reason: 'api_error_recorded', error: errorText })
          }
        } catch (error) {
          console.error('❌ Recorded video post error:', error)
          resolve({ success: false, reason: 'network_error_recorded', error: error.message })
        }
      }
      
      // Record for 2 seconds
      mediaRecorder.start()
      console.log('Recording started for 2 seconds...')
      
      setTimeout(() => {
        mediaRecorder.stop()
      }, 2000)
    })
    
  } catch (error) {
    console.error('❌ Could not access camera:', error)
    return { success: false, reason: 'no_camera_access', error: error.message }
  }
}

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive media debug tests...')
  
  // Test 1: Text post
  const textResult = await testTextPost()
  if (!textResult) {
    console.log('❌ Basic API is broken, stopping tests')
    return
  }
  
  // Test 2: Tiny media
  const tinyResult = await testTinyMediaPost()
  console.log('Tiny media result:', tinyResult)
  
  // Test 3: Recorded video (only if user grants permission)
  console.log('\n⚠️ Next test will request camera permission...')
  const recordedResult = await testRecordedVideoBlob()
  console.log('Recorded video result:', recordedResult)
  
  // Summary
  console.log('\n📊 TEST SUMMARY:')
  console.log('Text posts:', textResult ? '✅ Working' : '❌ Broken')
  console.log('Tiny media:', tinyResult.success ? '✅ Working' : `❌ Failed: ${tinyResult.reason}`)
  console.log('Recorded video:', recordedResult.success ? '✅ Working' : `❌ Failed: ${recordedResult.reason}`)
  
  if (tinyResult.success && recordedResult.success) {
    console.log('\n🎉 MEDIA UPLOAD IS WORKING! The issue might be specific to your recording process.')
  } else if (tinyResult.success && !recordedResult.success) {
    console.log('\n🔍 Small files work but recorded videos fail. Issue might be with video format or size.')
  } else if (!tinyResult.success) {
    console.log('\n❌ Media upload is completely broken. Check blob storage configuration.')
  }
}

// Auto-run the tests
runAllTests()

console.log('\n📋 INSTRUCTIONS:')
console.log('1. This script will run automatically')
console.log('2. Watch the console for results')
console.log('3. Grant camera permission when prompted for the full test')
console.log('4. The results will help identify the exact issue')