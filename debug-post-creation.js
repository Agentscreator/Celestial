// Comprehensive post creation debugging script
// Run this in the browser console on your app to debug the issue

const debugPostCreation = async () => {
  console.log('🔍 Starting comprehensive post creation debug...')
  
  // 1. Check authentication
  console.log('\n1️⃣ Checking authentication...')
  try {
    const authResponse = await fetch('/api/auth/session')
    const session = await authResponse.json()
    console.log('Session:', session)
    
    if (!session?.user?.id) {
      console.error('❌ No valid session found!')
      return
    }
    console.log('✅ Authentication OK')
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    return
  }
  
  // 2. Test database connection via a simple API
  console.log('\n2️⃣ Testing database connection...')
  try {
    const dbResponse = await fetch('/api/users/profile')
    if (dbResponse.ok) {
      console.log('✅ Database connection OK')
    } else {
      console.error('❌ Database connection failed:', dbResponse.status)
    }
  } catch (error) {
    console.error('❌ Database test failed:', error)
  }
  
  // 3. Test minimal post creation
  console.log('\n3️⃣ Testing minimal post creation...')
  try {
    const formData = new FormData()
    formData.append('content', 'Debug test post ' + Date.now())
    formData.append('isInvite', 'false')
    
    console.log('📤 Sending minimal post request...')
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Raw response:', responseText)
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Post creation successful:', result)
      } catch (e) {
        console.log('✅ Post created but response not JSON:', responseText)
      }
    } else {
      console.error('❌ Post creation failed')
      try {
        const errorData = JSON.parse(responseText)
        console.error('Error details:', errorData)
      } catch (e) {
        console.error('Raw error:', responseText)
      }
    }
  } catch (error) {
    console.error('❌ Network error during post creation:', error)
  }
  
  // 4. Test with test endpoint
  console.log('\n4️⃣ Testing with test endpoint...')
  try {
    const formData = new FormData()
    formData.append('content', 'Test endpoint post ' + Date.now())
    
    const response = await fetch('/api/test-simple-post', {
      method: 'POST',
      body: formData,
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Test endpoint works:', result)
    } else {
      const error = await response.text()
      console.error('❌ Test endpoint failed:', error)
    }
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
  }
  
  console.log('\n🏁 Debug complete!')
}

// Auto-run the debug
debugPostCreation()