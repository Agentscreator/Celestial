// Migration script to test R2 setup and create a test post
console.log('🚀 Starting R2 migration test...')

async function testR2Migration() {
  try {
    // Step 1: Test R2 connection
    console.log('\n1️⃣ Testing R2 connection...')
    const connectionResponse = await fetch('/api/test-r2-connection')
    
    if (connectionResponse.ok) {
      const connectionResult = await connectionResponse.json()
      console.log('✅ R2 connection test:', connectionResult.message)
      console.log('📋 Configuration:', connectionResult.config)
    } else {
      const connectionError = await connectionResponse.json()
      console.error('❌ R2 connection failed:', connectionError)
      console.error('Missing variables:', connectionError.missing)
      return
    }

    // Step 2: Test R2 upload
    console.log('\n2️⃣ Testing R2 upload...')
    const uploadResponse = await fetch('/api/test-r2-connection', {
      method: 'POST'
    })
    
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json()
      console.log('✅ R2 upload test successful!')
      console.log('📎 Test file URL:', uploadResult.testFileUrl)
    } else {
      const uploadError = await uploadResponse.json()
      console.error('❌ R2 upload failed:', uploadError)
      return
    }

    // Step 3: Test post creation with R2
    console.log('\n3️⃣ Testing post creation with R2...')
    
    // Create a small test image
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    // Draw a simple test pattern
    ctx.fillStyle = '#4F46E5'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px Arial'
    ctx.fillText('R2', 35, 55)
    
    // Convert to blob
    const testBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })
    
    const testFile = new File([testBlob], 'r2-test.png', { type: 'image/png' })
    
    // Create form data
    const formData = new FormData()
    formData.append('content', 'R2 Migration Test Post - ' + new Date().toISOString())
    formData.append('media', testFile)
    formData.append('isInvite', 'false')
    
    // Submit post
    const postResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    })
    
    console.log('Post creation response:', postResponse.status)
    
    if (postResponse.ok) {
      const postResult = await postResponse.json()
      console.log('✅ Post created successfully with R2!')
      console.log('📝 Post ID:', postResult.post.id)
      console.log('🖼️ Image URL:', postResult.post.image)
      
      // Verify the image is accessible
      if (postResult.post.image) {
        console.log('\n4️⃣ Verifying image accessibility...')
        try {
          const imageResponse = await fetch(postResult.post.image, { method: 'HEAD' })
          if (imageResponse.ok) {
            console.log('✅ Image is publicly accessible!')
            console.log('📊 Image size:', imageResponse.headers.get('content-length'), 'bytes')
            console.log('📋 Content type:', imageResponse.headers.get('content-type'))
          } else {
            console.warn('⚠️ Image may not be accessible:', imageResponse.status)
          }
        } catch (imageError) {
          console.warn('⚠️ Could not verify image accessibility:', imageError)
        }
      }
      
    } else {
      const postError = await postResponse.text()
      console.error('❌ Post creation failed:', postError)
      
      try {
        const errorJson = JSON.parse(postError)
        console.error('Error details:', errorJson)
      } catch (e) {
        console.error('Raw error:', postError.substring(0, 500))
      }
    }

    console.log('\n🎉 R2 migration test complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Configure your R2 environment variables')
    console.log('2. Test creating posts with images/videos')
    console.log('3. Deploy to production with R2 config')

  } catch (error) {
    console.error('❌ Migration test failed:', error)
  }
}

// Run the migration test
testR2Migration()