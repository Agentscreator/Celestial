/**
 * Script to fix existing media URLs in the database
 * This will update URLs from the broken media.mirro2.com to the correct R2 public URL
 */

async function fixExistingMediaUrls() {
  console.log('🔧 Fixing Existing Media URLs');
  console.log('==============================');
  
  try {
    // First, let's check what posts exist with broken URLs
    console.log('\n1️⃣ Checking for posts with broken media URLs...');
    
    const postsResponse = await fetch('/api/posts?feed=true');
    if (!postsResponse.ok) {
      throw new Error(`Failed to fetch posts: ${postsResponse.status}`);
    }
    
    const postsData = await postsResponse.json();
    const posts = postsData.posts || [];
    
    console.log(`📊 Found ${posts.length} posts to check`);
    
    const brokenPosts = posts.filter(post => {
      const hasVideo = post.video && post.video.includes('media.mirro2.com');
      const hasImage = post.image && post.image.includes('media.mirro2.com');
      return hasVideo || hasImage;
    });
    
    console.log(`🔍 Found ${brokenPosts.length} posts with broken media URLs`);
    
    if (brokenPosts.length === 0) {
      console.log('✅ No broken URLs found!');
      return;
    }
    
    // Display the broken URLs
    brokenPosts.forEach((post, index) => {
      console.log(`\n📄 Post ${index + 1} (ID: ${post.id}):`);
      if (post.video) {
        console.log(`  🎥 Video: ${post.video}`);
      }
      if (post.image) {
        console.log(`  🖼️ Image: ${post.image}`);
      }
    });
    
    // Create a fix API endpoint call for each broken post
    console.log('\n2️⃣ Creating fix requests...');
    
    const fixRequests = brokenPosts.map(post => {
      const fixedPost = { ...post };
      
      if (post.video && post.video.includes('media.mirro2.com')) {
        fixedPost.video = post.video.replace('https://media.mirro2.com', 'https://pub-2b8e11c545d78dd5ce3c39b5e38a1d84.r2.dev');
      }
      
      if (post.image && post.image.includes('media.mirro2.com')) {
        fixedPost.image = post.image.replace('https://media.mirro2.com', 'https://pub-2b8e11c545d78dd5ce3c39b5e38a1d84.r2.dev');
      }
      
      return {
        postId: post.id,
        originalVideo: post.video,
        originalImage: post.image,
        fixedVideo: fixedPost.video,
        fixedImage: fixedPost.image
      };
    });
    
    console.log('📋 Fix requests prepared:');
    fixRequests.forEach((fix, index) => {
      console.log(`\n🔧 Fix ${index + 1}:`);
      console.log(`  Post ID: ${fix.postId}`);
      if (fix.originalVideo !== fix.fixedVideo) {
        console.log(`  Video: ${fix.originalVideo} → ${fix.fixedVideo}`);
      }
      if (fix.originalImage !== fix.fixedImage) {
        console.log(`  Image: ${fix.originalImage} → ${fix.fixedImage}`);
      }
    });
    
    // Test the new URLs before applying fixes
    console.log('\n3️⃣ Testing fixed URLs...');
    
    const urlTests = [];
    for (const fix of fixRequests) {
      if (fix.fixedVideo && fix.fixedVideo !== fix.originalVideo) {
        urlTests.push({ type: 'video', postId: fix.postId, url: fix.fixedVideo });
      }
      if (fix.fixedImage && fix.fixedImage !== fix.originalImage) {
        urlTests.push({ type: 'image', postId: fix.postId, url: fix.fixedImage });
      }
    }
    
    console.log(`🔍 Testing ${urlTests.length} URLs...`);
    
    const testResults = [];
    for (const test of urlTests) {
      try {
        console.log(`  Testing ${test.type} for post ${test.postId}...`);
        const response = await fetch(test.url, { method: 'HEAD' });
        const accessible = response.ok;
        testResults.push({ ...test, accessible, status: response.status });
        console.log(`    ${accessible ? '✅' : '❌'} ${test.url} (${response.status})`);
      } catch (error) {
        testResults.push({ ...test, accessible: false, error: error.message });
        console.log(`    ❌ ${test.url} (Error: ${error.message})`);
      }
    }
    
    const accessibleCount = testResults.filter(r => r.accessible).length;
    console.log(`\n📊 URL Test Results: ${accessibleCount}/${testResults.length} URLs are accessible`);
    
    if (accessibleCount === 0) {
      console.error('❌ None of the fixed URLs are accessible. Check R2 configuration.');
      return;
    }
    
    // Note: We can't directly update the database from the frontend
    // Instead, we'll provide the SQL commands that need to be run
    console.log('\n4️⃣ Database Update Commands:');
    console.log('⚠️ The following SQL commands need to be run on your database:');
    console.log('');
    
    fixRequests.forEach(fix => {
      if (fix.originalVideo !== fix.fixedVideo || fix.originalImage !== fix.fixedImage) {
        let updateQuery = `UPDATE posts SET `;
        const updates = [];
        
        if (fix.originalVideo !== fix.fixedVideo) {
          updates.push(`video = '${fix.fixedVideo}'`);
        }
        
        if (fix.originalImage !== fix.fixedImage) {
          updates.push(`image = '${fix.fixedImage}'`);
        }
        
        updateQuery += updates.join(', ');
        updateQuery += ` WHERE id = ${fix.postId};`;
        
        console.log(updateQuery);
      }
    });
    
    console.log('');
    console.log('📝 To apply these fixes:');
    console.log('1. Connect to your PostgreSQL database');
    console.log('2. Run the UPDATE commands above');
    console.log('3. Refresh your app to see the fixed media');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
  }
}

// Alternative: Create a simple API endpoint to fix URLs
async function createFixApiEndpoint() {
  console.log('\n5️⃣ Alternative: API-based fix');
  console.log('This would require creating a /api/fix-media-urls endpoint');
  console.log('The endpoint would:');
  console.log('1. Query all posts with media.mirro2.com URLs');
  console.log('2. Update them to use pub-2b8e11c545d78dd5ce3c39b5e38a1d84.r2.dev');
  console.log('3. Return the number of posts fixed');
}

// Run the fix process
console.log('🚀 Starting media URL fix process...');
fixExistingMediaUrls().then(() => {
  createFixApiEndpoint();
  console.log('\n🏁 Media URL fix process completed!');
}).catch(error => {
  console.error('❌ Fix process failed:', error);
});