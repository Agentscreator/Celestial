import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

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
    // Check if we're running on a native platform
    if (Capacitor.isNativePlatform()) {
      // Request camera permissions - this triggers the native permission dialog
      try {
        const permissions = await Camera.requestPermissions();

        if (permissions.camera === 'granted') {
          return { granted: true };
        } else if (permissions.camera === 'denied') {
          return {
            granted: false,
            message: 'Camera permission denied. Please enable camera access in your device settings to record videos.'
          };
        } else {
          return {
            granted: false,
            message: 'Camera permission not determined. Please try again.'
          };
        }
      } catch (permissionError) {
        console.error('Native permission request failed:', permissionError);
        // Fallback to web API if native fails
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          stream.getTracks().forEach(track => track.stop());
          return { granted: true };
        } catch (webError) {
          return {
            granted: false,
            message: 'Failed to request camera permissions. Please try again or enable camera access in your device settings.'
          };
        }
      }
    } else {
      // For web, we still need to use getUserMedia to trigger browser permission dialog
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        // Stop the stream immediately as we just wanted to check permissions
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        let message = 'Camera and microphone access denied. Please allow permissions in your browser.';
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            message = 'Camera and microphone access denied. Please click "Allow" when prompted and try again.';
          } else if (error.name === 'NotFoundError') {
            message = 'No camera or microphone found. Please connect these devices and try again.';
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
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Camera.checkPermissions();

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
        // Fallback to web permission check
        try {
          const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
          return {
            granted: permissions.state === 'granted',
            message: permissions.state === 'granted' ? undefined : 'Camera permission not granted'
          };
        } catch (webError) {
          return { granted: false, message: 'Camera permissions need to be requested' };
        }
      }
    } else {
      // For web, try to check permissions using the Permissions API
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return {
          granted: permissions.state === 'granted',
          message: permissions.state === 'granted' ? undefined : 'Camera permissions need to be requested'
        };
      } catch (error) {
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
    // First check/request permissions
    const permissionResult = await requestCameraPermissions();
    
    if (!permissionResult.granted) {
      throw new Error(permissionResult.message || 'Camera permission denied');
    }

    // Now get the camera stream using web APIs
    // Note: Even on native platforms, we use web APIs for live camera preview
    // The Capacitor Camera plugin is mainly for taking photos/videos
    const constraints = {
      video: {
        width: { ideal: 720, min: 480 },
        height: { ideal: 1280, min: 640 },
        facingMode: options.facingMode
      },
      audio: options.audioEnabled
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
    
  } catch (error) {
    console.error('Error getting camera stream:', error);
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
 * Utility to convert facing mode to Capacitor direction
 */
export function facingModeToDirection(facingMode: 'user' | 'environment'): CameraDirection {
  return facingMode === 'user' ? CameraDirection.Front : CameraDirection.Rear;
}