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
 * Request camera and microphone permissions using direct getUserMedia
 * This bypasses Capacitor Camera plugin issues and works on all platforms
 */
export async function requestCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    console.log('Requesting camera permissions, platform:', Capacitor.getPlatform());
    console.log('Using direct getUserMedia approach for all platforms...');
    
    // Use getUserMedia directly - this works on both web and native platforms
    // and will trigger the native permission dialog on mobile devices
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
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return { 
      granted: false, 
      message: 'Failed to request camera permissions. Please try again.' 
    };
  }
}

/**
 * Check current camera permission status using Permissions API where available
 */
export async function checkCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    console.log('Checking camera permissions, platform:', Capacitor.getPlatform());
    
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
 * Take a photo using HTML5 Canvas (fallback approach)
 * This works on all platforms without Capacitor Camera plugin
 */
export async function takePhoto(facingMode: 'user' | 'environment' = 'environment') {
  try {
    console.log('Taking photo with facingMode:', facingMode);
    
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