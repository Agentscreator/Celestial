// Test script to verify camera permissions are working
// Run this in the browser console or as a standalone test

async function testCameraPermissions() {
  console.log('🎥 Testing Camera Permissions...');
  
  try {
    // Import the camera utility (this would work in your app context)
    // For testing, we'll use the basic approach
    
    // Test 1: Check if we're on a native platform
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    console.log('📱 Platform:', isNative ? 'Native (iOS/Android)' : 'Web');
    
    // Test 2: Check if Capacitor Camera plugin is available
    if (isNative && window.Capacitor.Plugins.Camera) {
      console.log('✅ Capacitor Camera plugin available');
      
      try {
        // Test requesting permissions
        const permissions = await window.Capacitor.Plugins.Camera.requestPermissions();
        console.log('🔐 Camera permissions:', permissions);
        
        if (permissions.camera === 'granted') {
          console.log('✅ Camera permission granted!');
        } else {
          console.log('❌ Camera permission denied:', permissions.camera);
        }
      } catch (error) {
        console.error('❌ Error requesting camera permissions:', error);
      }
    } else {
      console.log('🌐 Using web getUserMedia for permissions');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        console.log('✅ Web camera permissions granted!');
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('❌ Web camera permission denied:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCameraPermissions();

console.log(`
🎥 Camera Permission Test Instructions:

1. On Web:
   - Open browser dev tools
   - Run this script
   - You should see a browser permission dialog for camera/microphone

2. On Mobile (iOS/Android):
   - Build and run the app: npm run android:dev or npm run ios:dev
   - Open the app
   - Tap the "Create" button in navigation
   - You should see native permission dialogs

3. Expected Behavior:
   - First time: Native permission dialog appears
   - After granting: Camera preview starts immediately
   - After denying: Clear error message with instructions

4. Test Different Scenarios:
   - Grant permissions ✅
   - Deny permissions ❌
   - Revoke permissions in settings and test again
`);