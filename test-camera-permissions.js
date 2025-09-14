// Simple test script to debug camera permissions
// Run this in the browser console or as a standalone test

async function testCameraPermissions() {
  console.log('=== Camera Permission Test ===');
  
  // Test 1: Check if we're on a native platform
  try {
    const { Capacitor } = await import('@capacitor/core');
    console.log('Platform:', Capacitor.getPlatform());
    console.log('Is native platform:', Capacitor.isNativePlatform());
  } catch (error) {
    console.log('Capacitor not available, running in web mode');
  }

  // Test 2: Check camera permissions using Capacitor
  try {
    const { Camera } = await import('@capacitor/camera');
    console.log('Checking native camera permissions...');
    const permissions = await Camera.checkPermissions();
    console.log('Native permissions:', permissions);
    
    if (permissions.camera !== 'granted') {
      console.log('Requesting native camera permissions...');
      const requestResult = await Camera.requestPermissions();
      console.log('Permission request result:', requestResult);
    }
  } catch (error) {
    console.error('Native camera permission test failed:', error);
  }

  // Test 3: Check web camera permissions
  try {
    console.log('Testing web camera access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true
    });
    console.log('Web camera access successful:', stream);
    
    // Stop the stream
    stream.getTracks().forEach(track => track.stop());
    console.log('Camera stream stopped');
  } catch (error) {
    console.error('Web camera access failed:', error);
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
  }

  console.log('=== Test Complete ===');
}

// Run the test
testCameraPermissions();