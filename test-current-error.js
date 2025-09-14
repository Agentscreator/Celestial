// Test to see the exact current error
const testCurrentError = async () => {
  console.log('🔍 Testing current post creation to see exact error...')
  
  try {
    // Test the simplest possible post creation
    console.log('\n📤 Creating minimal test post...')
    
    const formData = new FormData()
    formData.append('content', 'Minimal test ' + Date.now())
    formData.append('isInvite', 'false')
    
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('📥 Response received:')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    // Get the response body
    const responseText = await response.text()
    console.log('Raw Response Body:', responseText)
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Success! Parsed result:', result)
      } catch (parseError) {
        console.log('✅ Success but not JSON:', responseText)
      }
    } else {
      console.error('❌ Error Response:')
      try {
        const errorData = JSON.parse(responseText)
        console.error('Parsed Error:', errorData)
      } catch (parseError) {
        console.error('Raw Error Text:', responseText)
      }
      
      // If it's a 500 error, let's check if there are any clues
      if (response.status === 500) {
        console.error('🚨 INTERNAL SERVER ERROR DETECTED!')
        console.error('This is the error we need to fix.')
      }
    }
    
  } catch (networkError) {
    console.error('❌ Network Error:', networkError)
  }
  
  console.log('\n🏁 Current error test complete!')
}

// Auto-run
testCurrentError()