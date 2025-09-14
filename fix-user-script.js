// Script to fix the missing user in database
const fixUserInDatabase = async () => {
  console.log('🔧 Fixing user in database...')
  
  try {
    // Call the fix-user API
    const response = await fetch('/api/fix-user', {
      method: 'POST',
    })
    
    console.log('Fix user response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ SUCCESS!', result.message)
      console.log('User data:', result.user)
      
      // Now test if posts work
      console.log('\n🧪 Testing post creation after fix...')
      
      const formData = new FormData()
      formData.append('content', 'Test post after user fix ' + Date.now())
      formData.append('isInvite', 'false')
      
      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })
      
      if (postResponse.ok) {
        const postResult = await postResponse.json()
        console.log('🎉 POST CREATION WORKS NOW!', postResult.message)
        console.log('Created post:', postResult.post)
      } else {
        const postError = await postResponse.text()
        console.error('❌ Post creation still fails:', postError)
      }
      
    } else {
      const errorText = await response.text()
      console.error('❌ Fix user failed:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Error fixing user:', error)
  }
}

fixUserInDatabase()