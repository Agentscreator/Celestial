// Test script to debug post deletion issue
console.log('🔍 Testing post deletion...')

async function testDeletePost() {
  try {
    // First, let's check if the post exists
    console.log('1️⃣ Checking if post ID 1 exists...')
    
    const getResponse = await fetch('/api/posts/1')
    console.log('GET /api/posts/1 status:', getResponse.status)
    
    if (getResponse.ok) {
      const postData = await getResponse.json()
      console.log('Post exists:', {
        id: postData.id,
        userId: postData.userId,
        content: postData.content?.substring(0, 50) + '...',
        hasImage: !!postData.image,
        hasVideo: !!postData.video
      })
      
      // Now try to delete it
      console.log('\n2️⃣ Attempting to delete post...')
      const deleteResponse = await fetch('/api/posts/1', {
        method: 'DELETE'
      })
      
      console.log('DELETE /api/posts/1 status:', deleteResponse.status)
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json()
        console.log('✅ Delete successful:', deleteResult)
      } else {
        const errorText = await deleteResponse.text()
        console.log('❌ Delete failed:', {
          status: deleteResponse.status,
          error: errorText
        })
      }
      
    } else if (getResponse.status === 404) {
      console.log('❌ Post ID 1 does not exist')
    } else {
      const errorText = await getResponse.text()
      console.log('❌ Error fetching post:', {
        status: getResponse.status,
        error: errorText
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDeletePost()