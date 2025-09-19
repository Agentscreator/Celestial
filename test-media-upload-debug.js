// Test media upload debugging
const testMediaUpload = async () => {
  console.log('🎬 MEDIA UPLOAD DEBUG TEST - Starting...')

  try {
    // Create a simple test video blob
    console.log('1️⃣ Creating test video blob...')
    
    // Create a minimal video blob for testing
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    
    // Draw a simple test pattern
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 160, 120)
    ctx.fillStyle = 'blue'
    ctx.fillRect(160, 0, 160, 120)
    ctx.fillStyle = 'green'
    ctx.fillRect(0, 120, 160, 120)
    ctx.fillStyle = 'yellow'
    ctx.fillRect(160, 120, 160, 120)
    
    // Convert canvas to blob
    const testBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'video/webm', 0.8)
    })
    
    if (!testBlob) {
      console.error('❌ Failed to create test blob')
      return
    }
    
    console.log('✅ Test blob created:', {
      size: testBlob.size,
      type: testBlob.type
    })

    // Create a File from the blob
    const testFile = new File([testBlob], 'test-video.webm', { 
      type: 'video/webm',
      lastModified: Date.now()
    })
    
    console.log('✅ Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type,
      lastModified: testFile.lastModified
    })

    // Test 1: Debug endpoint (text only)
    console.log('\n2️⃣ Testing debug endpoint (text only)...')
    const debugFormData = new FormData()
    debugFormData.append('content', 'Debug test post ' + Date.now())

    const debugResponse = await fetch('/api/debug-posts', {
      method: 'POST',
      body: debugFormData,
    })

    console.log('Debug response status:', debugResponse.status)
    
    if (debugResponse.ok) {
      const debugResult = await debugResponse.json()
      console.log('✅ Debug endpoint works:', debugResult.message)
    } else {
      const debugError = await debugResponse.text()
      console.error('❌ Debug endpoint failed:', debugError)
      return
    }

    // Test 2: Main endpoint with media
    console.log('\n3️⃣ Testing main endpoint with media...')
    const formData = new FormData()
    formData.append('content', 'Test post with media ' + Date.now())
    formData.append('media', testFile)
    formData.append('isInvite', 'false')

    console.log('FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`- ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value)
    }

    console.log('Making request to /api/posts...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const result = await response.json()
      console.log('🎉 POST WITH MEDIA SUCCESSFUL!')
      console.log('Post details:', {
        id: result.post?.id,
        content: result.post?.content,
        image: result.post?.image,
        video: result.post?.video,
        hasMedia: !!(result.post?.image || result.post?.video)
      })
      
      if (result.post?.video) {
        console.log('✅ Video URL created:', result.post.video)
      } else if (result.post?.image) {
        console.log('✅ Image URL created:', result.post.image)
      } else {
        console.log('⚠️ No media URL in response - this is the problem!')
      }
    } else {
      const errorText = await response.text()
      console.error('❌ Post with media failed:', errorText)
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText)
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Raw error (first 500 chars):', errorText.substring(0, 500))
      }
    }

    // Test 3: Check if it's a blob storage issue
    console.log('\n4️⃣ Testing blob storage directly...')
    
    // Create a simple test for blob upload
    const testFormData = new FormData()
    testFormData.append('content', 'Blob storage test ' + Date.now())
    
    // Create a very small test file
    const smallTestBlob = new Blob(['test video content'], { type: 'video/mp4' })
    const smallTestFile = new File([smallTestBlob], 'small-test.mp4', { type: 'video/mp4' })
    
    testFormData.append('media', smallTestFile)
    testFormData.append('isInvite', 'false')
    
    console.log('Testing with small file:', {
      name: smallTestFile.name,
      size: smallTestFile.size,
      type: smallTestFile.type
    })
    
    const smallFileResponse = await fetch('/api/posts', {
      method: 'POST',
      body: testFormData,
    })
    
    console.log('Small file response status:', smallFileResponse.status)
    
    if (smallFileResponse.ok) {
      const smallFileResult = await smallFileResponse.json()
      console.log('✅ Small file upload successful!')
      console.log('Media URL:', smallFileResult.post?.video || smallFileResult.post?.image)
    } else {
      const smallFileError = await smallFileResponse.text()
      console.error('❌ Small file upload failed:', smallFileError.substring(0, 300))
    }

  } catch (error) {
    console.error('❌ Test error:', error)
    console.error('Error stack:', error.stack)
  }

  console.log('\n🏁 Media upload debug test finished!')
}

// Run the test
testMediaUpload()