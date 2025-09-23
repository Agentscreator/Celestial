// Test script to verify profile image upload with Cloudflare R2
const fs = require('fs');
const FormData = require('form-data');

async function testProfileImageUpload() {
  try {
    console.log("=== TESTING PROFILE IMAGE UPLOAD WITH R2 ===");
    
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Write test image to file
    fs.writeFileSync('test-profile-image.png', testImageBuffer);
    
    const formData = new FormData();
    formData.append('profileImage', fs.createReadStream('test-profile-image.png'), {
      filename: 'test-profile-image.png',
      contentType: 'image/png'
    });
    
    console.log("📤 Sending request to profile image upload endpoint...");
    
    const response = await fetch('http://localhost:3000/api/users/profile-image', {
      method: 'POST',
      body: formData,
      headers: {
        // You'll need to add proper authentication headers here
        // 'Cookie': 'your-session-cookie'
      }
    });
    
    const result = await response.json();
    
    console.log("📥 Response status:", response.status);
    console.log("📥 Response body:", result);
    
    if (response.ok && result.imageUrl) {
      console.log("✅ Profile image upload successful!");
      console.log("🔗 Image URL:", result.imageUrl);
      
      // Verify the URL is from R2
      if (result.imageUrl.includes('r2.dev') || result.imageUrl.includes('cloudflarestorage.com')) {
        console.log("✅ Confirmed: Using Cloudflare R2 storage!");
      } else {
        console.log("⚠️  Warning: URL doesn't appear to be from R2");
      }
    } else {
      console.log("❌ Upload failed:", result);
    }
    
    // Clean up test file
    fs.unlinkSync('test-profile-image.png');
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testProfileImageUpload();