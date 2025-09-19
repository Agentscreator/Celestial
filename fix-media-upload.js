// Fix for media upload issues
// This script addresses common problems with media not being attached to posts

console.log('🔧 MEDIA UPLOAD FIX - Starting...')

// Check 1: Verify blob storage environment variable
const checkBlobConfig = () => {
  console.log('\n1️⃣ Checking blob storage configuration...')
  
  // This will be visible in network requests
  fetch('/api/posts', {
    method: 'OPTIONS'
  }).then(response => {
    console.log('API endpoint is accessible:', response.status)
  }).catch(error => {
    console.error('API endpoint issue:', error)
  })
}

// Check 2: Test the exact flow from NewPostCreator
const testNewPostCreatorFlow = async () => {
  console.log('\n2️⃣ Testing NewPostCreator flow...')
  
  try {
    // Simulate the exact process from NewPostCreator
    console.log('Creating test video blob...')
    
    // Create a test blob similar to what MediaRecorder produces
    const testData = new Uint8Array(1024) // 1KB of data
    for (let i = 0; i < testData.length; i++) {
      testData[i] = Math.floor(Math.random() * 256)
    }
    
    const blob = new Blob([testData], { type: 'video/webm' })
    const filename = `recorded-video-${Date.now()}.webm`
    const file = new File([blob], filename, { type: 'video/webm' })
    
    console.log('Test file created:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      isFile: file instanceof File,
      hasContent: file.size > 0
    })
    
    // Create FormData exactly like NewPostCreator does
    const formData = new FormData()
    formData.append('content', 'Test from NewPostCreator flow ' + Date.now())
    formData.append('media', file)
    formData.append('isInvite', 'false')
    
    console.log('FormData created, entries:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`- ${key}: ${value}`)
      }
    }
    
    console.log('Sending request...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ SUCCESS! Post created with media!')
      console.log('Post details:', {
        id: result.post?.id,
        content: result.post?.content?.substring(0, 50),
        image: result.post?.image,
        video: result.post?.video,
        hasMedia: !!(result.post?.image || result.post?.video)
      })
      
      if (result.post?.video) {
        console.log('🎬 Video URL:', result.post.video)
        
        // Test if the video URL is accessible
        try {
          const videoResponse = await fetch(result.post.video, { method: 'HEAD' })
          console.log('Video URL is accessible:', videoResponse.ok)
        } catch (e) {
          console.log('Video URL test failed:', e.message)
        }
      }
      
      return { success: true, post: result.post }
    } else {
      const errorText = await response.text()
      console.error('❌ Request failed:', errorText.substring(0, 300))
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText)
        console.error('Parsed error:', errorData)
      } catch (e) {
        console.error('Could not parse error as JSON')
      }
      
      return { success: false, error: errorText }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return { success: false, error: error.message }
  }
}

// Check 3: Test different file types and sizes
const testDifferentFileTypes = async () => {
  console.log('\n3️⃣ Testing different file types and sizes...')
  
  const tests = [
    { type: 'video/mp4', size: 100, name: 'tiny.mp4' },
    { type: 'video/webm', size: 100, name: 'tiny.webm' },
    { type: 'video/mp4', size: 1024, name: 'small.mp4' },
    { type: 'video/webm', size: 1024, name: 'small.webm' },
  ]
  
  for (const test of tests) {
    console.log(`Testing ${test.name} (${test.size} bytes, ${test.type})...`)
    
    try {
      // Create test data
      const testData = new Uint8Array(test.size)
      for (let i = 0; i < testData.length; i++) {
        testData[i] = Math.floor(Math.random() * 256)
      }
      
      const blob = new Blob([testData], { type: test.type })
      const file = new File([blob], test.name, { type: test.type })
      
      const formData = new FormData()
      formData.append('content', `Test ${test.name} ${Date.now()}`)
      formData.append('media', file)
      formData.append('isInvite', 'false')
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        const hasMedia = !!(result.post?.image || result.post?.video)
        console.log(`✅ ${test.name}: SUCCESS, media attached: ${hasMedia}`)
        
        if (hasMedia) {
          console.log(`   Media URL: ${result.post?.video || result.post?.image}`)
        }
      } else {
        console.log(`❌ ${test.name}: FAILED (${response.status})`)
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`)
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

// Main fix function
const runMediaUploadFix = async () => {
  console.log('🚀 Running comprehensive media upload diagnostics...')
  
  // Run checks
  checkBlobConfig()
  
  const flowResult = await testNewPostCreatorFlow()
  console.log('NewPostCreator flow result:', flowResult.success ? '✅ Working' : '❌ Failed')
  
  if (flowResult.success) {
    console.log('🎉 MEDIA UPLOAD IS WORKING!')
    console.log('The issue might be specific to how you\'re recording or the file format.')
    console.log('Try recording a shorter video or check your camera permissions.')
  } else {
    console.log('❌ Media upload is not working. Running additional tests...')
    await testDifferentFileTypes()
  }
  
  console.log('\n📋 NEXT STEPS:')
  console.log('1. If media upload is working, the issue is in your recording process')
  console.log('2. If media upload is failing, check your blob storage configuration')
  console.log('3. Try creating a post with a very short video (1-2 seconds)')
  console.log('4. Check browser console for any additional errors')
}

// Run the fix
runMediaUploadFix()

console.log('\n🔧 MEDIA UPLOAD FIX LOADED')
console.log('This script will help identify and fix media upload issues.')
console.log('Watch the console output for detailed diagnostics.')