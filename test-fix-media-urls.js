/**
 * Test script to fix broken media URLs
 */

async function testFixMediaUrls() {
  console.log('🔧 Testing Media URL Fix');
  console.log('=========================');
  
  try {
    console.log('\n1️⃣ Calling fix-media-urls API...');
    
    const response = await fetch('/api/fix-media-urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Fix API successful!');
      console.log('📊 Results:', {
        message: result.message,
        fixed: result.fixed,
        postsCount: result.posts?.length || 0
      });
      
      if (result.posts && result.posts.length > 0) {
        console.log('\n📄 Fixed posts:');
        result.posts.forEach((post, index) => {
          console.log(`\n  Post ${index + 1} (ID: ${post.id}):`);
          if (post.originalVideo !== post.fixedVideo) {
            console.log(`    🎥 Video: ${post.originalVideo} → ${post.fixedVideo}`);
          }
          if (post.originalImage !== post.fixedImage) {
            console.log(`    🖼️ Image: ${post.originalImage} → ${post.fixedImage}`);
          }
        });
      }
      
      // Test 2: Verify the fixes by checking a few URLs
      if (result.posts && result.posts.length > 0) {
        console.log('\n2️⃣ Verifying fixed URLs...');
        
        const testPost = result.posts[0];
        const urlsToTest = [];
        
        if (testPost.fixedVideo && testPost.fixedVideo !== testPost.originalVideo) {
          urlsToTest.push({ type: 'video', url: testPost.fixedVideo });
        }
        
        if (testPost.fixedImage && testPost.fixedImage !== testPost.originalImage) {
          urlsToTest.push({ type: 'image', url: testPost.fixedImage });
        }
        
        for (const test of urlsToTest) {
          console.log(`\n🔍 Testing ${test.type}: ${test.url}`);
          try {
            const testResponse = await fetch(test.url, { method: 'HEAD' });
            console.log(`📡 Status: ${testResponse.status} ${testResponse.statusText}`);
            
            if (testResponse.ok) {
              console.log('✅ URL is accessible!');
              console.log('📊 Content-Type:', testResponse.headers.get('content-type'));
              console.log('📊 Content-Length:', testResponse.headers.get('content-length'));
            } else {
              console.log('❌ URL is not accessible');
            }
          } catch (testError) {
            console.log('❌ URL test failed:', testError.message);
          }
        }
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ Fix API failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting media URL fix test...');
testFixMediaUrls().then(() => {
  console.log('\n🏁 Media URL fix test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});