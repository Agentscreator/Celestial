/**
 * Test script to check if media.mirro2.com is properly configured
 */

async function testCustomDomain() {
  console.log('🌐 Testing Custom Domain Configuration');
  console.log('=====================================');
  
  try {
    // Test 1: Check if media.mirro2.com resolves
    console.log('\n1️⃣ Testing domain resolution...');
    
    const testUrls = [
      'https://media.mirro2.com',
      'https://media.mirro2.com/test',
      'https://pub-2b8e11c545d78dd5ce3c39b5e38a1d84.r2.dev'
    ];
    
    for (const url of testUrls) {
      console.log(`\n🔍 Testing: ${url}`);
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'cors'
        });
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        console.log(`📊 Headers:`, {
          server: response.headers.get('server'),
          'content-type': response.headers.get('content-type'),
          'access-control-allow-origin': response.headers.get('access-control-allow-origin')
        });
        
        if (response.ok || response.status === 404) {
          console.log('✅ Domain is reachable');
        } else {
          console.log('⚠️ Domain returned non-OK status');
        }
      } catch (error) {
        console.log('❌ Domain test failed:', error.message);
        
        // Check if it's a CORS issue
        if (error.message.includes('CORS') || error.message.includes('blocked')) {
          console.log('💡 This might be a CORS issue, not a domain issue');
        }
      }
    }
    
    // Test 2: Check existing broken URL
    console.log('\n2️⃣ Testing existing broken URL...');
    const brokenUrl = 'https://media.mirro2.com/post-media/1758587109298-j1hfbl.webm';
    
    try {
      const response = await fetch(brokenUrl, { method: 'HEAD' });
      console.log(`📡 Broken URL status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ The URL actually works! The issue might be elsewhere.');
      } else if (response.status === 404) {
        console.log('⚠️ File not found - the domain works but file doesn\'t exist');
      } else {
        console.log('❌ Domain or file issue');
      }
    } catch (error) {
      console.log('❌ Broken URL test failed:', error.message);
    }
    
    // Test 3: Check DNS resolution (if possible)
    console.log('\n3️⃣ DNS and domain info...');
    console.log('🔍 To check DNS resolution, run in terminal:');
    console.log('   nslookup media.mirro2.com');
    console.log('   dig media.mirro2.com');
    
    // Test 4: Check if we need to configure custom domain
    console.log('\n4️⃣ Custom domain configuration check...');
    console.log('📋 For Cloudflare R2 custom domain, you need:');
    console.log('   1. A CNAME record: media.mirro2.com → pub-2b8e11c545d78dd5ce3c39b5e38a1d84.r2.dev');
    console.log('   2. Custom domain configured in Cloudflare R2 dashboard');
    console.log('   3. SSL certificate for media.mirro2.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test if we can create a test file and access it
async function testFileUploadAndAccess() {
  console.log('\n5️⃣ Testing file upload and access...');
  
  try {
    // Create a small test file
    const testData = new TextEncoder().encode('Test file for domain verification');
    const testBlob = new Blob([testData], { type: 'text/plain' });
    const testFile = new File([testBlob], 'domain-test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('content', 'Domain test post');
    formData.append('media', testFile);
    formData.append('isInvite', 'false');
    
    console.log('📤 Uploading test file...');
    
    const uploadResponse = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Upload successful');
      
      const mediaUrl = result.post?.image || result.post?.video;
      if (mediaUrl) {
        console.log('🔗 Media URL:', mediaUrl);
        
        // Test accessing the uploaded file
        console.log('🔍 Testing access to uploaded file...');
        try {
          const accessResponse = await fetch(mediaUrl, { method: 'HEAD' });
          console.log(`📡 Access status: ${accessResponse.status} ${accessResponse.statusText}`);
          
          if (accessResponse.ok) {
            console.log('✅ Uploaded file is accessible!');
            console.log('✅ Your R2 configuration is working correctly');
          } else {
            console.log('❌ Uploaded file is not accessible');
          }
        } catch (accessError) {
          console.log('❌ Access test failed:', accessError.message);
        }
      }
    } else {
      console.log('❌ Upload failed:', uploadResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Upload test failed:', error);
  }
}

// Run all tests
console.log('🚀 Starting custom domain tests...');
testCustomDomain().then(() => {
  return testFileUploadAndAccess();
}).then(() => {
  console.log('\n🏁 Custom domain tests completed!');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});