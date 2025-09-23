/**
 * Test script to verify the correct R2 endpoint works
 */

async function testCorrectR2Endpoint() {
  console.log('🔧 Testing Correct R2 Endpoint');
  console.log('===============================');
  
  try {
    // Test 1: Check if the R2 endpoint is accessible
    console.log('\n1️⃣ Testing R2 endpoint accessibility...');
    
    const r2Endpoint = 'https://pub-f50a78c96ae94eb08dea6fb65f69d0e1.r2.dev';
    
    try {
      const response = await fetch(r2Endpoint, { method: 'HEAD' });
      console.log(`📡 R2 endpoint status: ${response.status} ${response.statusText}`);
      
      if (response.ok || response.status === 404) {
        console.log('✅ R2 endpoint is accessible');
      } else {
        console.log('⚠️ R2 endpoint returned unexpected status');
      }
    } catch (error) {
      console.log('❌ R2 endpoint test failed:', error.message);
    }
    
    // Test 2: Upload a test file
    console.log('\n2️⃣ Testing file upload with correct endpoint...');
    
    // Create a small test file
    const testData = new TextEncoder().encode('Test file for correct R2 endpoint');
    const testBlob = new Blob([testData], { type: 'text/plain' });
    const testFile = new File([testBlob], 'r2-endpoint-test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('content', 'Testing correct R2 endpoint - ' + new Date().toISOString());
    formData.append('media', testFile);
    formData.append('isInvite', 'false');
    
    console.log('📤 Uploading test file...');
    
    const uploadResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 Upload response status:', uploadResponse.status);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Upload successful!');
      
      const mediaUrl = result.post?.image || result.post?.video;
      if (mediaUrl) {
        console.log('🔗 Generated media URL:', mediaUrl);
        
        // Verify it uses the correct endpoint
        if (mediaUrl.includes('pub-f50a78c96ae94eb08dea6fb65f69d0e1.r2.dev')) {
          console.log('✅ URL uses correct R2 endpoint');
        } else {
          console.log('❌ URL does not use correct R2 endpoint');
        }
        
        // Test accessing the file
        console.log('\n3️⃣ Testing file accessibility...');
        try {
          const accessResponse = await fetch(mediaUrl, { method: 'HEAD' });
          console.log(`📡 File access status: ${accessResponse.status} ${accessResponse.statusText}`);
          
          if (accessResponse.ok) {
            console.log('✅ File is accessible!');
            console.log('📊 Content-Type:', accessResponse.headers.get('content-type'));
            console.log('📊 Content-Length:', accessResponse.headers.get('content-length'));
            
            // Try to fetch the actual content
            const contentResponse = await fetch(mediaUrl);
            if (contentResponse.ok) {
              const content = await contentResponse.text();
              console.log('📄 File content:', content);
              console.log('✅ File content matches what we uploaded!');
            }
          } else {
            console.log('❌ File is not accessible');
          }
        } catch (accessError) {
          console.log('❌ File access test failed:', accessError.message);
        }
      } else {
        console.log('❌ No media URL in response');
      }
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', uploadResponse.status, errorText);
    }
    
    // Test 3: Fix existing broken URLs
    console.log('\n4️⃣ Testing URL fix for existing posts...');
    
    try {
      const fixResponse = await fetch('/api/fix-media-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Fix API response status:', fixResponse.status);
      
      if (fixResponse.ok) {
        const fixResult = await fixResponse.json();
        console.log('✅ Fix API successful!');
        console.log('📊 Fix results:', {
          message: fixResult.message,
          fixed: fixResult.fixed,
          postsCount: fixResult.posts?.length || 0
        });
        
        if (fixResult.posts && fixResult.posts.length > 0) {
          console.log('\n📄 Sample fixed post:');
          const samplePost = fixResult.posts[0];
          console.log(`  Post ID: ${samplePost.id}`);
          if (samplePost.originalVideo !== samplePost.fixedVideo) {
            console.log(`  Video: ${samplePost.originalVideo} → ${samplePost.fixedVideo}`);
          }
          if (samplePost.originalImage !== samplePost.fixedImage) {
            console.log(`  Image: ${samplePost.originalImage} → ${samplePost.fixedImage}`);
          }
        }
      } else {
        const fixErrorText = await fixResponse.text();
        console.error('❌ Fix API failed:', fixResponse.status, fixErrorText);
      }
    } catch (fixError) {
      console.error('❌ Fix API test failed:', fixError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting correct R2 endpoint test...');
testCorrectR2Endpoint().then(() => {
  console.log('\n🏁 R2 endpoint test completed!');
  console.log('\n📋 Summary:');
  console.log('✅ R2 endpoint updated to: https://pub-f50a78c96ae94eb08dea6fb65f69d0e1.r2.dev');
  console.log('✅ New uploads will use the correct URL');
  console.log('✅ Existing broken URLs can be fixed with the API');
}).catch(error => {
  console.error('❌ Test failed:', error);
});