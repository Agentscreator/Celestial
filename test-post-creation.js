// Test Post Creation
// Run this in browser console to test post creation

async function testPostCreation() {
  console.log('🧪 Testing post creation...')
  
  try {
    // Test 1: Text-only post
    console.log('📝 Testing text-only post...')
    const textFormData = new FormData()
    textFormData.append('content', 'Test text-only post from debug script')
    textFormData.append('isInvite', 'false')
    
    const textResponse = await fetch('/api/posts', {
      method: 'POST',
      body: textFormData
    })
    
    console.log('Text post response status:', textResponse.status)
    if (textResponse.ok) {
      const textResult = await textResponse.json()
      console.log('✅ Text post created successfully:', textResult.post?.id)
    } else {
      const textError = await textResponse.text()
      console.error('❌ Text post failed:', textError)
    }
    
    // Test 2: Create a small test video blob
    console.log('🎥 Testing video post...')
    
    // Create a minimal video blob for testing
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 100, 100)
    
    // Convert canvas to blob
    const testBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })
    
    const testFile = new File([testBlob], 'test-image.png', { type: 'image/png' })
    
    const mediaFormData = new FormData()
    mediaFormData.append('content', 'Test post with media from debug script')
    mediaFormData.append('media', testFile)
    mediaFormData.append('isInvite', 'false')
    
    console.log('📤 Sending media post request...')
    const mediaResponse = await fetch('/api/posts', {
      method: 'POST',
      body: mediaFormData
    })
    
    console.log('Media post response status:', mediaResponse.status)
    if (mediaResponse.ok) {
      const mediaResult = await mediaResponse.json()
      console.log('✅ Media post created successfully:', {
        id: mediaResult.post?.id,
        hasImage: !!mediaResult.post?.image,
        hasVideo: !!mediaResult.post?.video,
        imageUrl: mediaResult.post?.image,
        videoUrl: mediaResult.post?.video
      })
    } else {
      const mediaError = await mediaResponse.text()
      console.error('❌ Media post failed:', mediaError)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPostCreation()