// Test script to verify camera permissions fixes
// Run this in the browser console after deploying the app

async function testPermissions() {
  console.log('Testing camera permissions...');

  try {
    // Import the camera utilities
    const { requestCameraPermissions, checkCameraPermissions } = await import('./utils/camera.js');

    // Test checking permissions
    console.log('1. Checking current permissions...');
    const checkResult = await checkCameraPermissions();
    console.log('Check result:', checkResult);

    // Test requesting permissions
    console.log('2. Requesting permissions...');
    const requestResult = await requestCameraPermissions();
    console.log('Request result:', requestResult);

    if (requestResult.granted) {
      console.log('✅ Camera permissions granted successfully!');
    } else {
      console.log('❌ Camera permissions denied:', requestResult.message);
    }

    return requestResult;

  } catch (error) {
    console.error('❌ Error testing permissions:', error);
    return { granted: false, error: error.message };
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.testPermissions = testPermissions;
  console.log('✅ Test function loaded. Run window.testPermissions() to test.');
}