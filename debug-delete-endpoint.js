// Enhanced debug version of the DELETE endpoint logic
console.log('🔍 Debug DELETE endpoint logic...')

async function debugDeleteEndpoint() {
  try {
    // 1. Check current session
    console.log('1️⃣ Checking session...')
    const sessionResponse = await fetch('/api/auth/session')
    
    if (!sessionResponse.ok) {
      console.log('❌ Session check failed:', sessionResponse.status)
      return
    }
    
    const sessionData = await sessionResponse.json()
    console.log('Session data:', {
      hasUser: !!sessionData.user,
      userId: sessionData.user?.id,
      email: sessionData.user?.email
    })
    
    if (!sessionData.user?.id) {
      console.log('❌ No user session - this would cause 401 Unauthorized')
      return
    }
    
    // 2. Check if post exists and get its details
    console.log('\n2️⃣ Checking post details...')
    const postResponse = await fetch('/api/posts/1')
    
    if (!postResponse.ok) {
      console.log('❌ Post fetch failed:', postResponse.status)
      if (postResponse.status === 404) {
        console.log('Post ID 1 does not exist - this would cause 404')
      }
      return
    }
    
    const postData = await postResponse.json()
    console.log('Post data:', {
      id: postData.id,
      userId: postData.userId,
      currentUserId: sessionData.user.id,
      isOwner: postData.userId === sessionData.user.id,
      content: postData.content?.substring(0, 50) + '...'
    })
    
    if (postData.userId !== sessionData.user.id) {
      console.log('❌ User does not own this post - this would cause 404 (not found or unauthorized)')
      return
    }
    
    // 3. Check for related data that might prevent deletion
    console.log('\n3️⃣ Checking related data...')
    
    // Check comments
    const commentsResponse = await fetch(`/api/posts/1/comments`)
    if (commentsResponse.ok) {
      const commentsData = await commentsResponse.json()
      console.log('Comments count:', commentsData.comments?.length || 0)
    }
    
    // 4. Simulate the deletion process
    console.log('\n4️⃣ Simulating deletion process...')
    console.log('Would delete in this order:')
    console.log('- Post comments (post_comments table)')
    console.log('- Post likes (post_likes table)')  
    console.log('- Post invites (post_invites table)')
    console.log('- The post itself (posts table)')
    
    // 5. Try the actual deletion
    console.log('\n5️⃣ Attempting actual deletion...')
    const deleteResponse = await fetch('/api/posts/1', {
      method: 'DELETE'
    })
    
    console.log('Delete response status:', deleteResponse.status)
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json()
      console.log('✅ Deletion successful:', result)
    } else {
      const errorText = await deleteResponse.text()
      console.log('❌ Deletion failed:', errorText)
      
      // Try to parse as JSON for more details
      try {
        const errorJson = JSON.parse(errorText)
        console.log('Error details:', errorJson)
      } catch {
        console.log('Raw error text:', errorText)
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugDeleteEndpoint()