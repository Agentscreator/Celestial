// Simple test to isolate the media upload issue
console.log('🔍 SIMPLE MEDIA POST TEST - Starting...')

// This test should be run in the browser console on your app
const testSimpleMediaPost = async () => {
  try {
    console.log('1️⃣ Creating a simple test file...')
    
    // Create a simple text file as "video" for testing
    const testContent = 'This is a test video file content'
    const blob = new Blob([testContent], { type: 'video/mp4' })
    const file = new File([blob], 'test-video.mp4', { 
      type: 'video/mp4',
      lastModified: Date.now()
    })
    
    console.log('✅ Test file created:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      isFile: file instanceof File,
      hasContent: file.size > 0
    })

    console.log('2️⃣ Creating FormData...')
    const formData = new FormData()
    formData.append('content', 'Simple media test ' + Date.now())
    formData.append('media', file)
    formData.append('isInvite', 'false')

    // Log FormData contents
    console.log('FormData entries:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`- ${key}: ${value}`)
      }
    }

    console.log('3️⃣ Sending request to /api/posts...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (response.ok) {
      const result = await response.json()
      console.log('🎉 SUCCESS! Post created:', {
        id: result.post?.id,
        userId: result.post?.userId,
        content: result.post?.content,
        image: result.post?.image,
        video: result.post?.video,
        hasMedia: !!(result.post?.image || result.post?.video)
      })

      if (result.post?.video) {
        console.log('✅ Video URL created:', result.post.video)
        console.log('🔗 You can check this URL:', result.post.video)
      } else if (result.post?.image) {
        console.log('✅ Image URL created:', result.post.image)
        console.log('🔗 You can check this URL:', result.post.image)
      } else {
        console.log('❌ NO MEDIA URL - This is the problem!')
        console.log('The post was created but no media was attached')
      }
    } else {
      const errorText = await response.text()
      console.error('❌ Request failed:', errorText)
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(errorText)
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Raw error response:', errorText.substring(0, 500))
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error)
    console.error('Error stack:', error.stack)
  }
}

// Run the test
testSimpleMediaPost()

console.log('📋 To run this test:')
console.log('1. Open your app in the browser')
console.log('2. Open Developer Tools (F12)')
console.log('3. Go to Console tab')
console.log('4. Copy and paste this entire script')
console.log('5. Press Enter to run')