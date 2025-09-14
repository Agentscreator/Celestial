import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

export interface NativePermissionResult {
  granted: boolean;
  message?: string;
  shouldShowSettings?: boolean;
}

/**
 * Handle native permissions with proper error handling and user guidance
 */
export async function requestNativeCameraPermissions(): Promise<NativePermissionResult> {
  if (!Capacitor.isNativePlatform()) {
    return { granted: false, message: 'Not on native platform' };
  }

  try {
    console.log('=== Native Camera Permission Flow ===');
    console.log('Platform:', Capacitor.getPlatform());
    
    // Step 1: Check if Camera plugin is available
    if (!Capacitor.isPluginAvailable('Camera')) {
      console.error('Camera plugin not available');
      return {
        granted: false,
        message: 'Camera plugin not available. Please ensure the app is properly built for native platforms.'
      };
    }

    // Step 2: Check current permissions
    console.log('Checking current camera permissions...');
    let currentPermissions;
    try {
      currentPermissions = await Camera.checkPermissions();
      console.log('Current permissions:', currentPermissions);
    } catch (checkError) {
      console.error('Failed to check permissions:', checkError);
      return {
        granted: false,
        message: 'Failed to check camera permissions. Please restart the app and try again.'
      };
    }

    // Step 3: If already granted, return success
    if (currentPermissions.camera === 'granted') {
      console.log('✅ Camera permission already granted');
      return { granted: true };
    }

    // Step 4: If denied, guide user to settings
    if (currentPermissions.camera === 'denied') {
      console.log('❌ Camera permission previously denied');
      return {
        granted: false,
        shouldShowSettings: true,
        message: 'Camera permission was denied. Please go to your device settings and enable camera access for this app.'
      };
    }

    // Step 5: Request permissions
    console.log('Requesting camera permissions...');
    let requestResult;
    try {
      requestResult = await Camera.requestPermissions();
      console.log('Permission request result:', requestResult);
    } catch (requestError) {
      console.error('Failed to request permissions:', requestError);
      return {
        granted: false,
        message: 'Failed to request camera permissions. Please check your device settings.'
      };
    }

    // Step 6: Handle request result
    if (requestResult.camera === 'granted') {
      console.log('✅ Camera permission granted');
      return { granted: true };
    } else if (requestResult.camera === 'denied') {
      console.log('❌ Camera permission denied by user');
      return {
        granted: false,
        shouldShowSettings: true,
        message: 'Camera permission denied. Please enable camera access in your device settings to use this feature.'
      };
    } else {
      console.log('⚠️ Camera permission not determined');
      return {
        granted: false,
        message: 'Camera permission status unclear. Please try again or check your device settings.'
      };
    }

  } catch (error) {
    console.error('Unexpected error in native permission flow:', error);
    return {
      granted: false,
      message: 'An unexpected error occurred while requesting camera permissions. Please restart the app and try again.'
    };
  }
}

/**
 * Test if getUserMedia works after native permissions are granted
 */
export async function testNativeMediaAccess(options: { video: boolean; audio: boolean }): Promise<NativePermissionResult> {
  if (!Capacitor.isNativePlatform()) {
    return { granted: false, message: 'Not on native platform' };
  }

  try {
    console.log('Testing native media access with options:', options);
    
    const constraints: MediaStreamConstraints = {};
    
    if (options.video) {
      constraints.video = {
        width: { ideal: 720, min: 480 },
        height: { ideal: 1280, min: 640 },
        facingMode: 'user'
      };
    }
    
    if (options.audio) {
      constraints.audio = true;
    }

    console.log('getUserMedia constraints:', constraints);
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Native media access successful:', stream);
    
    // Log track details
    stream.getTracks().forEach(track => {
      console.log(`Track: ${track.kind} - ${track.label} - enabled: ${track.enabled}`);
    });
    
    // Clean up
    stream.getTracks().forEach(track => track.stop());
    
    return { granted: true };
    
  } catch (error) {
    console.error('❌ Native media access failed:', error);
    
    let message = 'Failed to access camera/microphone.';
    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
          message = 'Media access denied. Please check your device permissions.';
          break;
        case 'NotFoundError':
          message = 'No camera or microphone found on this device.';
          break;
        case 'NotReadableError':
          message = 'Camera is already in use by another app.';
          break;
        case 'OverconstrainedError':
          message = 'Camera settings not supported on this device.';
          break;
        case 'AbortError':
          message = 'Media access was interrupted.';
          break;
        default:
          message = `Media access error: ${error.message}`;
      }
    }
    
    return {
      granted: false,
      message,
      shouldShowSettings: error instanceof Error && error.name === 'NotAllowedError'
    };
  }
}

/**
 * Complete native camera setup flow
 */
export async function setupNativeCamera(options: { facingMode: 'user' | 'environment'; audioEnabled: boolean }): Promise<{ stream: MediaStream | null; error?: string }> {
  try {
    console.log('=== Complete Native Camera Setup ===');
    
    // Step 1: Request native permissions
    const permissionResult = await requestNativeCameraPermissions();
    if (!permissionResult.granted) {
      return { 
        stream: null, 
        error: permissionResult.message || 'Camera permission denied' 
      };
    }

    // Step 2: Test media access
    const mediaTest = await testNativeMediaAccess({ 
      video: true, 
      audio: options.audioEnabled 
    });
    
    if (!mediaTest.granted) {
      // Try without audio if audio failed
      if (options.audioEnabled) {
        console.log('Retrying without audio...');
        const videoOnlyTest = await testNativeMediaAccess({ 
          video: true, 
          audio: false 
        });
        
        if (videoOnlyTest.granted) {
          // Get video-only stream
          const constraints = {
            video: {
              width: { ideal: 720, min: 480 },
              height: { ideal: 1280, min: 640 },
              facingMode: options.facingMode
            }
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('✅ Video-only stream obtained');
          return { stream };
        }
      }
      
      return { 
        stream: null, 
        error: mediaTest.message || 'Failed to access camera' 
      };
    }

    // Step 3: Get the actual stream
    const constraints = {
      video: {
        width: { ideal: 720, min: 480 },
        height: { ideal: 1280, min: 640 },
        facingMode: options.facingMode
      },
      audio: options.audioEnabled
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Complete camera setup successful');
    
    return { stream };
    
  } catch (error) {
    console.error('Complete camera setup failed:', error);
    return { 
      stream: null, 
      error: error instanceof Error ? error.message : 'Unknown error during camera setup' 
    };
  }
}