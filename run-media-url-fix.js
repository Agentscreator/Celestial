/**
 * Simple script to fix all broken media URLs
 * Run this in your browser console after setting up the bucket policy
 */

async function runMediaUrlFix() {
  console.log('🔧 Running Media URL Fix');
  console.log('========================');
  
  try {
    console.log('📤 Calling fix-media-urls API...');
    
    const response = await fetch('/api/fix-media-urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Fix completed successfully!');
      console.log('📊 Results:');
      console.log(`   - Message: ${result.message}`);
      console.log(`   - Posts fixed: ${result.fixed}`);
      console.log(`   - Total posts processed: ${result.posts?.length || 0}`);
      
      if (result.posts && result.posts.length > 0) {
        console.log('\n📄 Fixed posts:');
        result.posts.forEach((post, index) => {
          console.log(`\n  ${index + 1}. Post ID: ${post.id}`);
          if (post.originalVideo !== post.fixedVideo) {
            console.log(`     🎥 Video: ${post.originalVideo}`);
            console.log(`     ➡️  Fixed: ${post.fixedVideo}`);
          }
          if (post.originalImage !== post.fixedImage) {
            console.log(`     🖼️  Image: ${post.originalImage}`);
            console.log(`     ➡️  Fixed: ${post.fixedImage}`);
          }
        });
        
        // Test a few fixed URLs
        console.log('\n🔍 Testing fixed URLs...');
        const testUrls = result.posts.slice(0, 3).map(post => 
          post.fixedVideo || post.fixedImage
        ).filter(Boolean);
        
        for (const url of testUrls) {
          try {
            const testResponse = await fetch(url, { method: 'HEAD' });
            const status = testResponse.ok ? '✅' : '❌';
            console.log(`   ${status} ${url} (${testResponse.status})`);
          } catch (error) {
            console.log(`   ❌ ${url} (Error: ${error.message})`);
          }
        }
      }
      
      console.log('\n🎉 Media URL fix completed!');
      console.log('💡 Refresh your app to see the fixed videos');
      
    } else {
      const errorText = await response.text();
      console.error('❌ Fix failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
  }
}

// Run the fix
console.log('🚀 Starting media URL fix...');
runMediaUrlFix();