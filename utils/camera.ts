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
    console.log('Requesting camera permissions, platform:', Capacitor.getPlatform());
    
    if (Capacitor.isNativePlatform()) {
      console.log('Using native Capacitor Camera permissions...');
      
      try {
        // Request permissions using Capacitor Camera plugin
        const permissions = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        
        console.log('Native camera permissions result:', permissions);
        
        const cameraGranted = permissions.camera === 'granted';
        const photosGranted = permissions.photos === 'granted';
        
        if (cameraGranted && photosGranted) {
          console.log('✅ All camera permissions granted');
          return { granted: true };
        } else {
          let message = 'Camera permissions required. ';
          if (!cameraGranted) message += 'Please allow camera access. ';
          if (!photosGranted) message += 'Please allow photo library access. ';
          message += 'You can enable these in your device Settings.';
          
          return { 
            granted: false, 
            message 
          };
        }
      } catch (error) {
        console.error('Native camera permission request failed:', error);
        return {
          granted: false,
          message: 'Failed to request camera permissions. Please enable camera access in your device Settings.'
        };
      }
    } else {
      console.log('Using web getUserMedia for permissions...');
      
      // Use getUserMedia for web platforms
      try {
        console.log('Attempting getUserMedia for permission check...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        console.log('✅ Camera and microphone permissions granted');
        
        // Stop the stream immediately as we just wanted to check permissions
        stream.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track: ${track.label}`);
          track.stop();
        });
        
        return { granted: true };
        
      } catch (error) {
        console.error('getUserMedia failed, trying video-only...', error);
        
        // If audio+video failed, try video only
        try {
          console.log('Attempting video-only getUserMedia...');
          const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
          console.log('✅ Camera permission granted (video-only)');
          
          videoStream.getTracks().forEach(track => {
            console.log(`Stopping ${track.kind} track: ${track.label}`);
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
    console.log('Checking camera permissions, platform:', Capacitor.getPlatform());
    
    if (Capacitor.isNativePlatform()) {
      console.log('Checking native camera permissions...');
      
      try {
        // Check permissions using Capacitor Camera plugin
        const permissions = await Camera.checkPermissions();
        console.log('Native camera permissions status:', permissions);
        
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
      console.log('Checking web camera permissions...');
      
      // Try to use the Permissions API (available on most modern browsers and WebView)
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Permission API check result:', permissions.state);
        
        return {
          granted: permissions.state === 'granted',
          message: permissions.state === 'granted' ? undefined : 'Camera permissions need to be requested'
        };
      } catch (error) {
        console.log('Permissions API not supported, cannot check current status');
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
    console.log('Getting camera stream with options:', options);
    console.log('Platform:', Capacitor.getPlatform());
    
    // Use direct getUserMedia approach for all platforms
    // This bypasses Capacitor Camera plugin issues
    const constraints = {
      video: {
        width: { ideal: 720, min: 480 },
        height: { ideal: 1280, min: 640 },
        facingMode: options.facingMode
      },
      audio: options.audioEnabled
    };

    console.log('Requesting getUserMedia with constraints:', constraints);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera stream obtained successfully:', stream);
      console.log('Stream tracks:', stream.getTracks().map(track => `${track.kind}: ${track.label}`));
      
      return stream;
      
    } catch (error) {
      console.error('getUserMedia failed:', error);
      
      // If audio+video failed, try video-only
      if (options.audioEnabled) {
        console.log('Retrying without audio...');
        try {
          const videoOnlyConstraints = {
            video: {
              width: { ideal: 720, min: 480 },
              height: { ideal: 1280, min: 640 },
              facingMode: options.facingMode
            }
          };
          
          const videoStream = await navigator.mediaDevices.getUserMedia(videoOnlyConstraints);
          console.log('✅ Video-only stream obtained:', videoStream);
          return videoStream;
          
        } catch (videoError) {
          console.error('Video-only stream also failed:', videoError);
          throw videoError;
        }
      } else {
        throw error;
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
    console.log('Taking photo with facingMode:', facingMode);
    
    if (Capacitor.isNativePlatform()) {
      console.log('Using native camera for photo...');
      
      // Use native Capacitor Camera plugin
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: facingMode === 'user' ? CameraDirection.Front : CameraDirection.Rear,
        saveToGallery: false
      });
      
      console.log('Native photo captured:', image);
      return { webPath: image.webPath, format: image.format };
      
    } else {
      console.log('Using web canvas approach for photo...');
      
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
    console.log('Requesting microphone permissions...');
    
    if (Capacitor.isNativePlatform()) {
      console.log('Using native microphone permission request...');
      
      // On native platforms, try to request microphone permission through getUserMedia
      // This will trigger the native permission dialog
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        console.log('✅ Native microphone permission granted');
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
      console.log('Using web microphone permission request...');
      
      // For web, use getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        console.log('✅ Web microphone permission granted');
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
    console.log('Available camera devices:', videoDevices);
    return videoDevices;
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
}