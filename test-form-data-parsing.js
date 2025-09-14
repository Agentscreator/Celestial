// Test form data parsing specifically
const testFormDataParsing = async () => {
  console.log('📝 Testing form data parsing...')
  
  try {
    // Test 1: Simple form data
    console.log('\n1️⃣ Testing simple form data...')
    const formData1 = new FormData()
    formData1.append('content', 'Test content')
    formData1.append('isInvite', 'false')
    
    console.log('Form data entries:')
    for (const [key, value] of formData1.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
    // Test 2: Send to posts API and capture detailed response
    console.log('\n2️⃣ Sending to posts API with detailed logging...')
    
    const startTime = Date.now()
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData1,
    })
    const endTime = Date.now()
    
    console.log(`⏱️ Request took: ${endTime - startTime}ms`)
    console.log('📊 Response details:')
    console.log('  Status:', response.status)
    console.log('  Status Text:', response.statusText)
    console.log('  OK:', response.ok)
    console.log('  Type:', response.type)
    console.log('  URL:', response.url)
    
    console.log('📋 Response Headers:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
    // Get response body
    const responseText = await response.text()
    console.log('📄 Response Body Length:', responseText.length)
    console.log('📄 Response Body:', responseText)
    
    if (!response.ok) {
      console.error('🚨 ERROR RESPONSE DETECTED!')
      
      // Check if it's HTML (might be a Next.js error page)
      if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        console.error('❌ Response is HTML - this suggests a Next.js error page')
        console.error('This usually means there\'s a server-side error in the API route')
        
        // Look for error messages in the HTML
        const errorMatch = responseText.match(/<title>(.*?)<\/title>/i)
        if (errorMatch) {
          console.error('HTML Title:', errorMatch[1])
        }
        
        const preMatch = responseText.match(/<pre[^>]*>(.*?)<\/pre>/is)
        if (preMatch) {
          console.error('Error Details:', preMatch[1].replace(/<[^>]*>/g, ''))
        }
      } else {
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText)
          console.error('JSON Error:', errorData)
        } catch (parseError) {
          console.error('Raw Error Text:', responseText)
        }
      }
    } else {
      console.log('✅ Success! Response received')
      try {
        const result = JSON.parse(responseText)
        console.log('Parsed Result:', result)
      } catch (parseError) {
        console.log('Response (not JSON):', responseText)
      }
    }
    
  } catch (networkError) {
    console.error('❌ Network Error:', networkError)
    console.error('Error details:', {
      name: networkError.name,
      message: networkError.message,
      stack: networkError.stack
    })
  }
  
  console.log('\n🏁 Form data parsing test complete!')
}

// Auto-run
testFormDataParsing()