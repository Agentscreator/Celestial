// Detailed error checking after user fix
const detailedErrorCheck = async () => {
  console.log('🔍 DETAILED ERROR CHECK - After user fix...')
  
  try {
    // Step 1: Verify user exists now
    console.log('\n1️⃣ Checking if user exists in database...')
    const userResponse = await fetch('/api/users/profile')
    
    if (userResponse.ok) {
      const userData = await userResponse.json()
      console.log('✅ User exists:', userData.user.id)
    } else {
      console.error('❌ User still missing:', await userResponse.text())
      return
    }
    
    // Step 2: Try the debug posts endpoint first
    console.log('\n2️⃣ Testing debug posts endpoint...')
    const formData1 = new FormData()
    formData1.append('content', 'Debug test ' + Date.now())
    
    const debugResponse = await fetch('/api/debug-posts', {
      method: 'POST',
      body: formData1,
    })
    
    if (debugResponse.ok) {
      const debugResult = await debugResponse.json()
      console.log('✅ Debug posts works:', debugResult.message)
    } else {
      const debugError = await debugResponse.text()
      console.error('❌ Debug posts fails:', debugError)
    }
    
    // Step 3: Try main posts endpoint with detailed error capture
    console.log('\n3️⃣ Testing main posts endpoint with error details...')
    const formData2 = new FormData()
    formData2.append('content', 'Main test ' + Date.now())
    formData2.append('isInvite', 'false')
    
    const mainResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData2,
    })
    
    console.log('Main posts status:', mainResponse.status)
    console.log('Main posts headers:', Object.fromEntries(mainResponse.headers.entries()))
    
    const responseText = await mainResponse.text()
    console.log('Main posts response length:', responseText.length)
    
    if (mainResponse.ok) {
      console.log('✅ SUCCESS! Main posts works!')
      try {
        const result = JSON.parse(responseText)
        console.log('Result:', result)
      } catch (e) {
        console.log('Response (not JSON):', responseText.substring(0, 500))
      }
    } else {
      console.error('❌ Main posts still fails!')
      
      // Check if it's HTML error page
      if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        console.error('🚨 HTML ERROR PAGE detected')
        
        // Extract error from HTML
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i)
        if (titleMatch) {
          console.error('HTML Title:', titleMatch[1])
        }
        
        const h1Match = responseText.match(/<h1[^>]*>(.*?)<\/h1>/i)
        if (h1Match) {
          console.error('HTML H1:', h1Match[1])
        }
        
        const preMatch = responseText.match(/<pre[^>]*>(.*?)<\/pre>/is)
        if (preMatch) {
          console.error('Error Stack:', preMatch[1].replace(/<[^>]*>/g, '').substring(0, 1000))
        }
        
        console.error('🔍 This is a server-side error in the API route')
        console.error('Check your terminal/server logs for the full error')
        
      } else {
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText)
          console.error('JSON Error:', errorData)
        } catch (parseError) {
          console.error('Raw Error (first 500 chars):', responseText.substring(0, 500))
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error)
  }
  
  console.log('\n🏁 Detailed error check complete!')
}

detailedErrorCheck()