/**
 * Test script to verify that camera permissions work without triggering native camera UI
 */

async function testCameraFix() {
  console.log('🧪 Testing Camera Fix - No Native UI Should Appear');
  console.log('='.repeat(50));

  try {
    // Import the updated camera utilities
    const { requestCameraPermissions, checkCameraPermissions, getCameraStream } = await import('./utils/camera.js');
    
    console.log('✅ Successfully imported updated camera utilities');

    // Test 1: Check current permissions (should not trigger native UI)
    console.log('\n1️⃣ Testing checkCameraPermissions...');
    try {
      const checkResult = await checkCameraPermissions();
      console.log('✅ Check result:', checkResult);
    } catch (error) {
      console.log('⚠️ Check failed (this is okay):', error.message);
    }

    // Test 2: Request permissions (should use getUserMedia, not native camera)
    console.log('\n2️⃣ Testing requestCameraPermissions...');
    try {
      const requestResult = await requestCameraPermissions();
      console.log('✅ Request result:', requestResult);
      
      if (requestResult.granted) {
        console.log('🎉 Permissions granted via getUserMedia (no native UI)');
      } else {
        console.log('❌ Permissions denied:', requestResult.message);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }

    // Test 3: Try to get camera stream (should work without native UI)
    console.log('\n3️⃣ Testing getCameraStream...');
    try {
      const stream = await getCameraStream({
        facingMode: 'user',
        audioEnabled: true
      });
      
      if (stream) {
        console.log('✅ Camera stream obtained successfully');
        console.log('📊 Stream details:', {
          id: stream.id,
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        
        // Stop the stream to clean up
        stream.getTracks().forEach(track => track.stop());
        console.log('🧹 Stream cleaned up');
      } else {
        console.log('❌ No camera stream obtained');
      }
    } catch (error) {
      console.log('❌ Stream failed:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Summary:');
    console.log('- If no native camera UI appeared, the fix is working!');
    console.log('- You should only see browser permission prompts');
    console.log('- Your custom recording interface should be the only UI');

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

// Run the test
testCameraFix().catch(console.error);