// Test the simple endpoint to isolate the issue
const testSimpleEndpoint = async () => {
  console.log('🧪 Testing simple endpoint to isolate issue...')
  
  try {
    console.log('\n📤 Testing /api/test-simple...')
    
    const formData = new FormData()
    formData.append('content', 'Simple test ' + Date.now())
    
    const response = await fetch('/api/test-simple', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Simple Response:')
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)
    
    if (response.ok) {
      console.log('✅ Simple endpoint works!')
      console.log('This means the issue is specifically in the posts API logic.')
      try {
        const result = JSON.parse(responseText)
        console.log('Simple result:', result)
      } catch (e) {
        console.log('Simple response (not JSON):', responseText)
      }
    } else {
      console.error('❌ Simple endpoint fails!')
      console.error('This suggests a fundamental issue (Next.js, auth, etc.)')
      
      if (response.status === 500) {
        console.error('🚨 Even the simple endpoint returns 500!')
        console.error('Check server logs, Next.js setup, or environment issues.')
      }
    }
    
  } catch (error) {
    console.error('❌ Simple endpoint network error:', error)
  }
  
  console.log('\n🏁 Simple endpoint test complete!')
}

// Auto-run
testSimpleEndpoint()