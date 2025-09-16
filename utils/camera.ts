import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

export interface CameraPermissionResult {
  granted: boolean;
  message?: string;
}

export interface CameraStreamOptions {
  facingMode: 'user' | 'environment';
  audioEnabled: boolean;
}

/**
 * Request camera permissions using native Capacitor Camera plugin on mobile
 * Falls back to getUserMedia on web
 */
export async function requestCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    
    if (Capacitor.isNativePlatform()) {
      
      try {
        // First try to request permissions using Capacitor Camera plugin
        const permissions = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        
        
        const cameraGranted = permissions.camera === 'granted';
        const photosGranted = permissions.photos === 'granted';
        
        if (cameraGranted && photosGranted) {
          return { granted: true };
        }
        
        // If requestPermissions didn't work, try to trigger permission by using camera
        
        try {
          await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            saveToGallery: false
          });
          
          return { granted: true };
          
        } catch (cameraError) {
          
          let message = 'Camera permissions required. ';
          if (!cameraGranted) message += 'Please allow camera access. ';
          if (!photosGranted) message += 'Please allow photo library access. ';
          message += 'You can enable these in your device Settings → Apps → MirroSocial → Permissions.';
          
          return { 
            granted: false, 
            message 
          };
        }
      } catch (error) {
        console.error('Native camera permission request failed:', error);
        return {
          granted: false,
          message: 'Failed to request camera permissions. Please enable camera access in your device Settings → Apps → MirroSocial → Permissions.'
        };
      }
    } else {
      
      // Use getUserMedia for web platforms
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Stop the stream immediately as we just wanted to check permissions
        stream.getTracks().forEach(track => {
          track.stop();
        });
        
        return { granted: true };
        
      } catch (error) {
        console.error('getUserMedia failed, trying video-only...', error);
        
        // If audio+video failed, try video only
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
          
          videoStream.getTracks().forEach(track => {
              track.stop();
          });
          
          return { granted: true };
          
        } catch (videoError) {
          console.error('Video-only getUserMedia also failed:', videoError);
          
          let message = 'Camera access denied. Please allow camera permissions.';
          if (videoError instanceof Error) {
            switch (videoError.name) {
              case 'NotAllowedError':
                message = 'Camera permission denied. Please allow camera access when prompted and try again.';
                break;
              case 'NotFoundError':
                message = 'No camera found on this device. Please check your device has a camera.';
                break;
              case 'NotReadableError':
                message = 'Camera is already in use by another app. Please close other apps and try again.';
                break;
              case 'OverconstrainedError':
                message = 'Camera settings not supported on this device.';
                break;
              case 'AbortError':
                message = 'Camera access was interrupted. Please try again.';
                break;
              default:
                message = `Camera error: ${videoError.message}`;
            }
          }
          
          return { 
            granted: false, 
            message 
          };
        }
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
 * Check current camera permission status using native Capacitor on mobile
 * Falls back to Permissions API on web
 */
export async function checkCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    
    if (Capacitor.isNativePlatform()) {
      
      try {
        // Check permissions using Capacitor Camera plugin
        const permissions = await Camera.checkPermissions();
        
        const cameraGranted = permissions.camera === 'granted';
        const photosGranted = permissions.photos === 'granted';
        
        return {
          granted: cameraGranted && photosGranted,
          message: (cameraGranted && photosGranted) ? undefined : 'Camera permissions need to be requested'
        };
      } catch (error) {
        console.error('Failed to check native camera permissions:', error);
        return {
          granted: false,
          message: 'Failed to check camera permissions'
        };
      }
    } else {
      
      // Try to use the Permissions API (available on most modern browsers and WebView)
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        return {
          granted: permissions.state === 'granted',
          message: permissions.state === 'granted' ? undefined : 'Camera permissions need to be requested'
        };
      } catch (error) {
        // Permissions API not supported, we'll need to request to find out
        return { 
          granted: false, 
          message: 'Camera permissions need to be requested (cannot check current status)' 
        };
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
    
    // Use direct getUserMedia approach for all platforms
    // This bypasses Capacitor Camera plugin issues
    const constraints = {
      video: {
        facingMode: options.facingMode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        aspectRatio: { ideal: 16/9 }, // Standard aspect ratio to prevent cropping
        frameRate: { ideal: 30 }
      },
      audio: options.audioEnabled
    };

    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      return stream;
      
    } catch (error) {
      console.error('getUserMedia failed with constraints:', error);
      
      // Try with simpler constraints if the detailed ones failed
      try {
        const simpleConstraints = {
          video: {
            facingMode: options.facingMode
          },
          audio: options.audioEnabled
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
        return stream;
        
      } catch (simpleError) {
        console.error('Simple getUserMedia also failed:', simpleError);
        
        // If audio+video failed, try video-only
        if (options.audioEnabled) {
        try {
          const videoOnlyConstraints = {
            video: {
              facingMode: options.facingMode,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              aspectRatio: { ideal: 16/9 }, // Standard aspect ratio to prevent cropping
              frameRate: { ideal: 30 }
            }
          };
          
          const videoStream = await navigator.mediaDevices.getUserMedia(videoOnlyConstraints);
          return videoStream;
          
        } catch (videoError) {
          console.error('Video-only stream also failed:', videoError);
          
          // Final fallback - try with just facingMode
          try {
            const fallbackConstraints = {
              video: {
                facingMode: options.facingMode
              }
            };
            
            const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            return fallbackStream;
            
          } catch (fallbackError) {
            console.error('All camera constraint attempts failed:', fallbackError);
            throw fallbackError;
          }
        }
      } else {
        throw simpleError;
      }
    }
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
 * Take a photo using native Capacitor Camera plugin on mobile
 * Falls back to HTML5 Canvas approach on web
 */
export async function takePhoto(facingMode: 'user' | 'environment' = 'environment') {
  try {
    
    if (Capacitor.isNativePlatform()) {
      
      // Use native Capacitor Camera plugin
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: facingMode === 'user' ? CameraDirection.Front : CameraDirection.Rear,
        saveToGallery: false
      });
      
      return { webPath: image.webPath, format: image.format };
      
    } else {
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current frame to canvas
          context?.drawImage(video, 0, 0);
          
          // Stop the stream
          stream.getTracks().forEach(track => track.stop());
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({ webPath: url, format: 'jpeg' });
            } else {
              reject(new Error('Failed to capture photo'));
            }
          }, 'image/jpeg', 0.9);
        };
        
        video.onerror = () => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error('Failed to load video'));
        };
      });
    }
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
}

/**
 * Request microphone permissions using native APIs where possible
 */
export async function requestMicrophonePermissions(): Promise<CameraPermissionResult> {
  try {
    
    if (Capacitor.isNativePlatform()) {
      
      // On native platforms, try to request microphone permission through getUserMedia
      // This will trigger the native permission dialog
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        console.error('Native microphone permission failed:', error);
        
        let message = 'Microphone permission denied. Please enable microphone access in your device Settings.';
        if (error instanceof Error && error.name === 'NotAllowedError') {
          message = 'Microphone access denied. Please allow microphone permissions when prompted and try again.';
        }
        
        return {
          granted: false,
          message
        };
      }
    } else {
      
      // For web, use getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (error) {
        console.error('Web microphone permission error:', error);
        
        let message = 'Microphone access denied. Please allow microphone permissions.';
        if (error instanceof Error && error.name === 'NotAllowedError') {
          message = 'Microphone permission denied. Please allow microphone access when prompted.';
        }
        
        return {
          granted: false,
          message
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
 * Utility to get available camera devices
 */
export async function getCameraDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices;
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
}