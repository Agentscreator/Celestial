/**
 * Test script to verify native camera permissions are working correctly
 * Run this in your mobile app to test the permission flow
 */

import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

async function testNativePermissions() {
  console.log('🧪 Testing Native Camera Permissions');
  console.log('Platform:', Capacitor.getPlatform());
  console.log('Is Native Platform:', Capacitor.isNativePlatform());
  
  try {
    // Step 1: Check current permissions
    console.log('\n📋 Step 1: Checking current permissions...');
    const currentPermissions = await Camera.checkPermissions();
    console.log('Current permissions:', currentPermissions);
    
    // Step 2: Request permissions if needed
    console.log('\n🔐 Step 2: Requesting permissions...');
    const requestedPermissions = await Camera.requestPermissions({
      permissions: ['camera', 'photos']
    });
    console.log('Requested permissions result:', requestedPermissions);
    
    // Step 3: Verify permissions are granted
    const cameraGranted = requestedPermissions.camera === 'granted';
    const photosGranted = requestedPermissions.photos === 'granted';
    
    console.log('\n✅ Permission Status:');
    console.log('Camera:', cameraGranted ? '✅ Granted' : '❌ Denied');
    console.log('Photos:', photosGranted ? '✅ Granted' : '❌ Denied');
    
    if (cameraGranted && photosGranted) {
      console.log('\n🎉 All permissions granted! You should now see camera permissions in your device settings.');
      
      // Step 4: Test taking a photo
      console.log('\n📸 Step 4: Testing photo capture...');
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'Uri',
          source: 'Camera'
        });
        console.log('✅ Photo captured successfully:', photo.webPath);
      } catch (photoError) {
        console.error('❌ Photo capture failed:', photoError);
      }
    } else {
      console.log('\n❌ Permissions not fully granted. Please check your device settings:');
      console.log('- Go to Settings > Apps > MirroSocial > Permissions');
      console.log('- Enable Camera and Storage permissions');
    }
    
  } catch (error) {
    console.error('❌ Permission test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you\'re running this on a physical device (not simulator)');
    console.log('2. Check that Capacitor Camera plugin is properly installed');
    console.log('3. Verify your capacitor.config.ts has Camera plugin configured');
    console.log('4. Try rebuilding and syncing your app: npm run mobile:sync');
  }
}

// Test getUserMedia as fallback
async function testGetUserMedia() {
  console.log('\n🌐 Testing getUserMedia (fallback)...');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    console.log('✅ getUserMedia successful');
    console.log('Video tracks:', stream.getVideoTracks().length);
    console.log('Audio tracks:', stream.getAudioTracks().length);
    
    // Stop the stream
    stream.getTracks().forEach(track => track.stop());
    
  } catch (error) {
    console.error('❌ getUserMedia failed:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Camera Permission Tests\n');
  
  if (Capacitor.isNativePlatform()) {
    await testNativePermissions();
  } else {
    console.log('📱 Running on web platform, testing getUserMedia only...');
  }
  
  await testGetUserMedia();
  
  console.log('\n✨ Tests completed!');
}

// Export for use in your app
export { testNativePermissions, testGetUserMedia, runAllTests };

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Add a global function to test from browser console
  window.testCameraPermissions = runAllTests;
  console.log('💡 You can run camera permission tests by calling: testCameraPermissions()');
}