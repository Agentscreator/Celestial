import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { setupNativeCamera } from './native-permissions';

export interface CameraPermissionResult {
  granted: boolean;
  message?: string;
}

export interface CameraStreamOptions {
  facingMode: 'user' | 'environment';
  audioEnabled: boolean;
}

/**
 * Request camera and microphone permissions using Capacitor's native permission system
 * This will show the native Android/iOS permission dialog
 */
export async function requestCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    console.log('Requesting camera permissions, platform:', Capacitor.getPlatform());
    
    // Check if we're running on a native platform
    if (Capacitor.isNativePlatform()) {
      console.log('Native platform detected, requesting native permissions...');
      
      try {
        // First check current permissions
        const currentPermissions = await Camera.checkPermissions();
        console.log('Current camera permissions:', currentPermissions);

        // If already granted, return success
        if (currentPermissions.camera === 'granted') {
          console.log('Camera permission already granted');
          return { granted: true };
        }

        // Request permissions - this triggers the native permission dialog
        console.log('Requesting camera permissions...');
        const permissions = await Camera.requestPermissions();
        console.log('Permission request result:', permissions);

        if (permissions.camera === 'granted') {
          console.log('Camera permission granted');
          return { granted: true };
        } else if (permissions.camera === 'denied') {
          console.log('Camera permission denied');
          return {
            granted: false,
            message: 'Camera permission denied. Please enable camera access in your device settings to record videos.'
          };
        } else {
          console.log('Camera permission not determined');
          return {
            granted: false,
            message: 'Camera permission not determined. Please try again.'
          };
        }
      } catch (permissionError) {
        console.error('Native permission request failed:', permissionError);
        
        // Try a fallback approach for native platforms
        console.log('Trying fallback: direct getUserMedia on native platform...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false // Start with video only on native
          });
          console.log('Fallback getUserMedia succeeded on native platform');
          stream.getTracks().forEach(track => track.stop());
          return { granted: true };
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return {
            granted: false,
            message: 'Failed to request camera permissions. Please enable camera access in your device settings and restart the app.'
          };
        }
      }
    } else {
      console.log('Web platform detected, using getUserMedia...');
      
      // For web, we still need to use getUserMedia to trigger browser permission dialog
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        console.log('Web camera permission granted');
        // Stop the stream immediately as we just wanted to check permissions
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        console.error('Web camera permission error:', error);
        let message = 'Camera and microphone access denied. Please allow permissions in your browser.';
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            message = 'Camera and microphone access denied. Please click "Allow" when prompted and try again.';
          } else if (error.name === 'NotFoundError') {
            message = 'No camera or microphone found. Please connect these devices and try again.';
          } else if (error.name === 'NotReadableError') {
            message = 'Camera is already in use by another application. Please close other apps and try again.';
          }
        }
        return { 
          granted: false, 
          message 
        };
      }
    }
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return { 
      granted: false, 
      message: 'Failed to request camera permissions. Please try again.' 
    };
  }
}

/**
 * Check current camera permission status
 */
export async function checkCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    console.log('Checking camera permissions, platform:', Capacitor.getPlatform());
    
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Camera.checkPermissions();
        console.log('Native permission check result:', permissions);

        if (permissions.camera === 'granted') {
          return { granted: true };
        } else {
          return {
            granted: false,
            message: 'Camera permission not granted'
          };
        }
      } catch (error) {
        console.error('Native permission check failed:', error);
        return { granted: false, message: 'Failed to check native camera permissions' };
      }
    } else {
      // For web, try to check permissions using the Permissions API
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Web permission check result:', permissions.state);
        return {
          granted: permissions.state === 'granted',
          message: permissions.state === 'granted' ? undefined : 'Camera permissions need to be requested'
        };
      } catch (error) {
        console.log('Permissions API not supported, will need to request via getUserMedia');
        // Permissions API not supported, assume we need to request
        return { granted: false, message: 'Camera permissions need to be requested' };
      }
    }
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return {
      granted: false,
      message: 'Failed to check camera permissions'
    };
  }
}

/**
 * Get camera stream with proper permission handling
 * This function will request permissions if needed and then get the camera stream
 */
export async function getCameraStream(options: CameraStreamOptions): Promise<MediaStream | null> {
  try {
    console.log('Getting camera stream with options:', options);
    
    if (Capacitor.isNativePlatform()) {
      console.log('Native platform: using comprehensive native camera setup...');
      
      // Use the new native camera setup flow
      const result = await setupNativeCamera({
        facingMode: options.facingMode,
        audioEnabled: options.audioEnabled
      });
      
      if (result.stream) {
        console.log('✅ Native camera setup successful');
        return result.stream;
      } else {
        console.error('❌ Native camera setup failed:', result.error);
        throw new Error(result.error || 'Failed to setup native camera');
      }
    } else {
      console.log('Web platform: using standard getUserMedia flow...');
      
      // For web platforms, use the standard flow
      const constraints = {
        video: {
          width: { ideal: 720, min: 480 },
          height: { ideal: 1280, min: 640 },
          facingMode: options.facingMode
        },
        audio: options.audioEnabled
      };

      console.log('Requesting getUserMedia with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained successfully on web:', stream);
      
      return stream;
    }
    
  } catch (error) {
    console.error('Error getting camera stream:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found. Please check your device has a camera.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use. Please close other apps using the camera.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Camera constraints not supported. Please try again.');
      } else if (error.name === 'AbortError') {
        throw new Error('Camera access was aborted. Please try again.');
      }
    }
    
    throw error;
  }
}

/**
 * Take a photo using Capacitor's native camera
 * This provides better integration with native camera features
 */
export async function takePhoto(direction: CameraDirection = CameraDirection.Rear) {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      direction: direction
    });

    return image;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
}

/**
 * Request microphone permissions separately (for native platforms)
 */
export async function requestMicrophonePermissions(): Promise<CameraPermissionResult> {
  try {
    console.log('Requesting microphone permissions...');
    
    if (Capacitor.isNativePlatform()) {
      // On native platforms, microphone permission is usually handled together with camera
      // But we can try to request it separately via getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        console.log('Microphone permission granted');
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        console.error('Microphone permission failed:', error);
        return {
          granted: false,
          message: 'Microphone permission denied. Please enable microphone access in your device settings.'
        };
      }
    } else {
      // For web, use getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        console.log('Web microphone permission granted');
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        console.error('Web microphone permission error:', error);
        return {
          granted: false,
          message: 'Microphone access denied. Please allow microphone permissions.'
        };
      }
    }
  } catch (error) {
    console.error('Error requesting microphone permissions:', error);
    return {
      granted: false,
      message: 'Failed to request microphone permissions.'
    };
  }
}

/**
 * Utility to convert facing mode to Capacitor direction
 */
export function facingModeToDirection(facingMode: 'user' | 'environment'): CameraDirection {
  return facingMode === 'user' ? CameraDirection.Front : CameraDirection.Rear;
}