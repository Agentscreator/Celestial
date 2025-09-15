/**
 * Direct permission testing utilities
 * This bypasses all Capacitor plugins and uses only web APIs
 */

export async function testDirectPermissions() {
  console.log('=== Direct Permission Test ===');
  
  // Test 1: Check if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('❌ getUserMedia not available');
    return { success: false, error: 'getUserMedia not supported' };
  }
  
  console.log('✅ getUserMedia is available');
  
  // Test 2: Try to get camera permission
  try {
    console.log('Requesting camera permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' },
      audio: true 
    });
    
    console.log('✅ Camera permission granted!');
    console.log('Stream tracks:', stream.getTracks().length);
    
    // Log track details
    stream.getTracks().forEach(track => {
      console.log(`- ${track.kind}: ${track.label} (enabled: ${track.enabled})`);
    });
    
    // Stop all tracks
    stream.getTracks().forEach(track => track.stop());
    console.log('✅ Stream stopped');
    
    return { success: true, tracks: stream.getTracks().length };
    
  } catch (error) {
    console.error('❌ Camera permission failed:', error);
    
    if (error instanceof Error) {
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      
      if (error.name === 'NotAllowedError') {
        console.log('🔍 This means:');
        console.log('- Permission was denied by user');
        console.log('- OR permissions not declared in app manifest');
        console.log('- OR app needs to be reinstalled');
      }
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function testPermissionAPI() {
  console.log('=== Permission API Test ===');
  
  try {
    // Test camera permission
    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    console.log('Camera permission state:', cameraPermission.state);
    
    // Test microphone permission
    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    console.log('Microphone permission state:', micPermission.state);
    
    return {
      camera: cameraPermission.state,
      microphone: micPermission.state
    };
  } catch (error) {
    console.log('Permission API not supported:', error);
    return { error: 'Permission API not supported' };
  }
}

export async function enumerateDevices() {
  console.log('=== Device Enumeration Test ===');
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log('Total devices:', devices.length);
    
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const audioDevices = devices.filter(d => d.kind === 'audioinput');
    
    console.log('Video devices:', videoDevices.length);
    console.log('Audio devices:', audioDevices.length);
    
    videoDevices.forEach((device, index) => {
      console.log(`Video ${index + 1}: ${device.label || 'Unknown Camera'} (${device.deviceId})`);
    });
    
    audioDevices.forEach((device, index) => {
      console.log(`Audio ${index + 1}: ${device.label || 'Unknown Microphone'} (${device.deviceId})`);
    });
    
    return {
      total: devices.length,
      video: videoDevices.length,
      audio: audioDevices.length,
      devices
    };
  } catch (error) {
    console.error('Device enumeration failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}