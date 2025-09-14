// Detailed test to isolate the post creation issue
const testPostCreationDetailed = async () => {
  console.log('🔍 Starting detailed post creation test...')
  
  try {
    // Test 1: Simple post without invites
    console.log('\n1️⃣ Testing simple post creation...')
    const formData1 = new FormData()
    formData1.append('content', 'Simple test post ' + Date.now())
    formData1.append('isInvite', 'false')
    
    const response1 = await fetch('/api/posts', {
      method: 'POST',
      body: formData1,
    })
    
    console.log('Response status:', response1.status)
    console.log('Response headers:', Object.fromEntries(response1.headers.entries()))
    
    if (response1.ok) {
      const result1 = await response1.json()
      console.log('✅ Simple post created successfully:', result1.post.id)
    } else {
      const errorText = await response1.text()
      console.error('❌ Simple post failed:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.error('Parsed error:', errorJson)
      } catch (e) {
        console.error('Raw error text:', errorText)
      }
    }
    
    // Test 2: Post with invite but no community name
    console.log('\n2️⃣ Testing post with invite (no community)...')
    const formData2 = new FormData()
    formData2.append('content', 'Invite test post ' + Date.now())
    formData2.append('isInvite', 'true')
    formData2.append('inviteDescription', 'Join me for coffee')
    formData2.append('inviteLimit', '5')
    
    const response2 = await fetch('/api/posts', {
      method: 'POST',
      body: formData2,
    })
    
    if (response2.ok) {
      const result2 = await response2.json()
      console.log('✅ Invite post (no community) created:', result2.post.id)
    } else {
      const errorText = await response2.text()
      console.error('❌ Invite post (no community) failed:', errorText)
    }
    
    // Test 3: Post with invite and community name (this might be the problematic one)
    console.log('\n3️⃣ Testing post with invite and community...')
    const formData3 = new FormData()
    formData3.append('content', 'Community invite test ' + Date.now())
    formData3.append('isInvite', 'true')
    formData3.append('inviteDescription', 'Join our coffee group')
    formData3.append('inviteLimit', '10')
    formData3.append('groupName', 'Coffee Lovers ' + Date.now())
    
    const response3 = await fetch('/api/posts', {
      method: 'POST',
      body: formData3,
    })
    
    if (response3.ok) {
      const result3 = await response3.json()
      console.log('✅ Community invite post created:', result3.post.id)
    } else {
      const errorText = await response3.text()
      console.error('❌ Community invite post failed:', errorText)
      
      // This is likely where the error occurs
      console.error('🚨 This is likely the source of the internal server error!')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
  
  console.log('\n🏁 Detailed test complete!')
}

// Auto-run the test
testPostCreationDetailed()