// Comprehensive debugging to find the exact issue
const comprehensiveDebug = async () => {
  console.log('🔍 COMPREHENSIVE DEBUG - Finding the exact issue...')
  
  // Step 1: Test authentication
  console.log('\n1️⃣ Testing authentication...')
  try {
    const authResponse = await fetch('/api/auth/session')
    if (authResponse.ok) {
      const session = await authResponse.json()
      console.log('✅ Auth OK:', session?.user?.id ? 'Logged in' : 'Not logged in')
      if (!session?.user?.id) {
        console.log('❌ You need to be logged in to create posts!')
        return
      }
    } else {
      console.error('❌ Auth check failed:', authResponse.status)
      return
    }
  } catch (error) {
    console.error('❌ Auth error:', error)
    return
  }
  
  // Step 2: Test database connection
  console.log('\n2️⃣ Testing database connection...')
  try {
    const dbResponse = await fetch('/api/test-db')
    if (dbResponse.ok) {
      const dbResult = await dbResponse.json()
      console.log('✅ Database OK:', dbResult)
    } else {
      const dbError = await dbResponse.text()
      console.error('❌ Database failed:', dbError)
    }
  } catch (error) {
    console.error('❌ Database error:', error)
  }
  
  // Step 3: Test simple endpoint
  console.log('\n3️⃣ Testing simple endpoint...')
  try {
    const formData = new FormData()
    formData.append('content', 'Simple test')
    
    const simpleResponse = await fetch('/api/test-simple', {
      method: 'POST',
      body: formData,
    })
    
    if (simpleResponse.ok) {
      const simpleResult = await simpleResponse.json()
      console.log('✅ Simple endpoint OK:', simpleResult.message)
    } else {
      const simpleError = await simpleResponse.text()
      console.error('❌ Simple endpoint failed:', simpleError)
    }
  } catch (error) {
    console.error('❌ Simple endpoint error:', error)
  }
  
  // Step 4: Test debug posts endpoint
  console.log('\n4️⃣ Testing debug posts endpoint...')
  try {
    const formData = new FormData()
    formData.append('content', 'Debug test')
    
    const debugResponse = await fetch('/api/debug-posts', {
      method: 'POST',
      body: formData,
    })
    
    if (debugResponse.ok) {
      const debugResult = await debugResponse.json()
      console.log('✅ Debug posts OK:', debugResult.message)
    } else {
      const debugError = await debugResponse.text()
      console.error('❌ Debug posts failed:', debugError)
    }
  } catch (error) {
    console.error('❌ Debug posts error:', error)
  }
  
  // Step 5: Test main posts endpoint (the problematic one)
  console.log('\n5️⃣ Testing MAIN posts endpoint (the problematic one)...')
  try {
    const formData = new FormData()
    formData.append('content', 'Main test ' + Date.now())
    formData.append('isInvite', 'false')
    
    console.log('📤 Sending request to /api/posts...')
    const mainResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Response status:', mainResponse.status)
    console.log('📥 Response headers:', Object.fromEntries(mainResponse.headers.entries()))
    
    const responseText = await mainResponse.text()
    console.log('📥 Raw response:', responseText)
    
    if (mainResponse.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ MAIN POSTS ENDPOINT WORKS!', result.message)
        console.log('🎉 The issue has been fixed!')
      } catch (parseError) {
        console.log('✅ Main posts OK but response not JSON:', responseText)
      }
    } else {
      console.error('❌ MAIN POSTS ENDPOINT STILL FAILING!')
      console.error('Status:', mainResponse.status)
      console.error('Response:', responseText)
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(responseText)
        console.error('Error details:', errorData)
        
        if (errorData.details) {
          console.error('🔍 Specific error details:', errorData.details)
        }
      } catch (parseError) {
        console.error('Raw error text:', responseText)
      }
    }
  } catch (error) {
    console.error('❌ Main posts network error:', error)
  }
  
  // Step 6: Test with invite (if main works)
  console.log('\n6️⃣ Testing posts with invite...')
  try {
    const formData = new FormData()
    formData.append('content', 'Invite test ' + Date.now())
    formData.append('isInvite', 'true')
    formData.append('inviteDescription', 'Test invite')
    formData.append('inviteLimit', '5')
    
    const inviteResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    if (inviteResponse.ok) {
      const inviteResult = await inviteResponse.json()
      console.log('✅ Invite posts work too:', inviteResult.message)
    } else {
      const inviteError = await inviteResponse.text()
      console.error('❌ Invite posts failed:', inviteError)
    }
  } catch (error) {
    console.error('❌ Invite posts error:', error)
  }
  
  console.log('\n🏁 Comprehensive debug complete!')
}

// Auto-run
comprehensiveDebug()