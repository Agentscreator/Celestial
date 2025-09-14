// Complete fix and test script
const completeFixAndTest = async () => {
  console.log('🔧 COMPLETE FIX AND TEST - Starting...')
  
  try {
    // Step 1: Run the complete user fix
    console.log('\n1️⃣ Running complete user fix...')
    const fixResponse = await fetch('/api/fix-user-complete', {
      method: 'POST',
    })
    
    if (fixResponse.ok) {
      const fixResult = await fixResponse.json()
      console.log('✅ User fix successful:', fixResult.message)
      console.log('User data:', fixResult.user)
    } else {
      const fixError = await fixResponse.text()
      console.error('❌ User fix failed:', fixError)
      return
    }
    
    // Step 2: Test profile API
    console.log('\n2️⃣ Testing profile API...')
    const profileResponse = await fetch('/api/users/profile')
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      console.log('✅ Profile API works:', profileData.user.username)
    } else {
      const profileError = await profileResponse.text()
      console.error('❌ Profile API still fails:', profileError)
    }
    
    // Step 3: Test posts creation
    console.log('\n3️⃣ Testing post creation...')
    const formData = new FormData()
    formData.append('content', 'Test post after complete fix ' + Date.now())
    formData.append('isInvite', 'false')
    
    const postResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    })
    
    console.log('Post response status:', postResponse.status)
    
    if (postResponse.ok) {
      const postResult = await postResponse.json()
      console.log('🎉 POST CREATION WORKS!', postResult.message)
      console.log('Created post:', postResult.post)
      
      // Step 4: Test profile page refresh
      console.log('\n4️⃣ Profile should work now - refresh the profile page!')
      console.log('The "Something went wrong" error should be gone.')
      
    } else {
      const postError = await postResponse.text()
      console.error('❌ Post creation still fails:', postError)
      
      // Show detailed error
      if (postError.includes('<html>')) {
        console.error('🚨 Still getting HTML error page')
        const titleMatch = postError.match(/<title>(.*?)<\/title>/i)
        if (titleMatch) {
          console.error('Error title:', titleMatch[1])
        }
      } else {
        try {
          const errorData = JSON.parse(postError)
          console.error('Error details:', errorData)
        } catch (e) {
          console.error('Raw error:', postError.substring(0, 300))
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Complete fix error:', error)
  }
  
  console.log('\n🏁 Complete fix and test finished!')
}

completeFixAndTest()