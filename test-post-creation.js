// Simple test to reproduce post creation error
const testPostCreation = async () => {
  try {
    console.log('🧪 Testing post creation...')
    
    const formData = new FormData()
    formData.append('content', 'Test post content')
    formData.append('isInvite', 'false')
    
    console.log('📤 Sending request to /api/posts...')
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Success:', result)
    } else {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.error('❌ Parsed error:', errorJson)
      } catch (e) {
        console.error('❌ Raw error text:', errorText)
      }
    }
  } catch (error) {
    console.error('❌ Network/JS error:', error)
  }
}

// Run the test
testPostCreation()