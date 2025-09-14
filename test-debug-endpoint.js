// Test the debug endpoint to isolate the issue
const testDebugEndpoint = async () => {
  console.log('🔧 Testing debug endpoint...')
  
  try {
    console.log('\n📤 Testing /api/debug-posts...')
    
    const formData = new FormData()
    formData.append('content', 'Debug test ' + Date.now())
    
    const response = await fetch('/api/debug-posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Debug Response:')
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
    if (response.ok) {
      console.log('✅ Debug endpoint works! The issue is in the main posts API.')
      try {
        const result = JSON.parse(responseText)
        console.log('Debug result:', result)
      } catch (e) {
        console.log('Debug response (not JSON):', responseText)
      }
    } else {
      console.error('❌ Debug endpoint also fails!')
      console.error('This suggests a more fundamental issue (auth, database, etc.)')
    }
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
  }
  
  console.log('\n🏁 Debug endpoint test complete!')
}

// Auto-run
testDebugEndpoint()