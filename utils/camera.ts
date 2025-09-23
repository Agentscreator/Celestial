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
 * Request camera permissions using getUserMedia only (avoids native camera UI)
 * This ensures we only use the custom recording interface
 */
export async function requestCameraPermissions(): Promise<CameraPermissionResult> {
  try {
    console.log('🔐 Requesting camera permissions...');

    // Detect iOS
    const isIOS = Capacitor.getPlatform() === 'ios' ||
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    console.log('📱 iOS detected:', isIOS);

    // For iOS, be more conservative with permission requests
    if (isIOS) {
      try {
        // Try video-only first on iOS to avoid audio permission complications
        console.log('🍎 iOS: Requesting video-only permission first...');
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });

        videoStream.getTracks().forEach(track => {
          track.stop();
        });

        console.log('✅ iOS: Video permission granted');
        return { granted: true };

      } catch (videoError) {
        console.error('❌ iOS: Video permission failed:', videoError);

        let message = 'Camera access denied. Please allow camera permissions.';
        if (videoError instanceof Error) {
          switch (videoError.name) {
            case 'NotAllowedError':
              message = 'Camera permission denied. Please go to Settings → MirroSocial → Camera and enable camera access.';
              break;
            case 'NotFoundError':
              message = 'No camera found on this device.';
              break;
            case 'NotReadableError':
              message = 'Camera is already in use. Please close other apps using the camera.';
              break;
            case 'OverconstrainedError':
              message = 'Camera constraints not supported on this device.';
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

    // For non-iOS platforms, use the original approach
    console.log('🤖 Non-iOS: Using standard permission request...');

    // Use getUserMedia for all platforms to avoid triggering native camera UI
    // This will request permissions but won't open the native camera interface
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
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return {
      granted: false,
      message: 'Failed to request camera permissions. Please try again.'
    };
  }
}

/**
 * Check current camera permission status using Permissions API
 * Avoids native camera plugin to prevent triggering native UI
 */
export async function checkCameraPermissions(): Promise<CameraPermissionResult> {
  try {

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
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return {
      granted: false,
      message: 'Failed to check camera permissions'
    };
  }
}

/**
 * Get camera stream with proper permission handling and iOS-specific optimizations
 * This function will request permissions if needed and then get the camera stream
 */
export async function getCameraStream(options: CameraStreamOptions): Promise<MediaStream | null> {
  try {
    console.log('🎥 Getting camera stream with options:', options);
    console.log('🔍 User Agent:', navigator.userAgent);
    console.log('🔍 Platform:', navigator.platform);

    // Create a timeout promise to prevent infinite hanging on iOS
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Camera initialization timeout after 10 seconds'));
      }, 10000);
    });

    // Detect iOS more reliably
    const isIOS = Capacitor.getPlatform() === 'ios' ||
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    console.log('📱 Detected iOS:', isIOS);

    let constraints;
    if (isIOS) {
      // For iOS, use the most basic constraints first to avoid hanging
      constraints = {
        video: {
          facingMode: options.facingMode
        },
        audio: options.audioEnabled
      };
      console.log('🍎 Using iOS-optimized constraints');
    } else {
      // For other platforms, use more detailed constraints
      constraints = {
        video: {
          facingMode: options.facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30 }
        },
        audio: options.audioEnabled
      };
      console.log('🤖 Using standard constraints');
    }

    console.log('📋 Final constraints:', JSON.stringify(constraints, null, 2));

    try {
      // Race the getUserMedia call against timeout
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise
      ]);

      console.log('✅ Camera stream obtained successfully');
      return stream;

    } catch (error) {
      console.error('❌ Primary getUserMedia failed:', error);

      // iOS-specific fallback: try simpler constraints but keep audio if requested
      if (isIOS) {
        try {
          console.log('🔄 Trying iOS fallback constraints...');
          const fallbackConstraints = {
            video: { facingMode: options.facingMode },
            audio: options.audioEnabled // Keep audio setting from original request
          };

          const stream = await Promise.race([
            navigator.mediaDevices.getUserMedia(fallbackConstraints),
            timeoutPromise
          ]);

          console.log('✅ iOS fallback stream obtained with audio:', options.audioEnabled);
          return stream;

        } catch (fallbackError) {
          console.error('❌ iOS fallback also failed:', fallbackError);

          // Only try without audio if audio was originally requested and failed
          if (options.audioEnabled) {
            try {
              console.log('🔄 Trying iOS video-only as last resort...');
              const videoOnlyConstraints = {
                video: { facingMode: options.facingMode },
                audio: false
              };

              const videoStream = await Promise.race([
                navigator.mediaDevices.getUserMedia(videoOnlyConstraints),
                timeoutPromise
              ]);

              console.warn('⚠️ iOS: Got video-only stream (audio failed)');
              return videoStream;

            } catch (videoOnlyError) {
              console.error('❌ iOS video-only also failed:', videoOnlyError);
              throw videoOnlyError;
            }
          } else {
            throw fallbackError;
          }
        }
      }

      // Non-iOS fallback logic
      try {
        const simpleConstraints = {
          video: { facingMode: options.facingMode },
          audio: options.audioEnabled
        };

        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia(simpleConstraints),
          timeoutPromise
        ]);

        return stream;

      } catch (simpleError) {
        console.error('Simple getUserMedia also failed:', simpleError);

        // Final fallback - only use video-only if audio was not requested
        if (!options.audioEnabled) {
          try {
            const videoOnlyConstraints = {
              video: { facingMode: options.facingMode }
            };

            const videoStream = await Promise.race([
              navigator.mediaDevices.getUserMedia(videoOnlyConstraints),
              timeoutPromise
            ]);

            console.log('✅ Video-only fallback stream obtained');
            return videoStream;

          } catch (videoError) {
            console.error('Video-only stream also failed:', videoError);
            throw videoError;
          }
        } else {
          // If audio was requested but failed, don't fall back to video-only
          // This ensures we don't create silent videos when audio was expected
          console.error('❌ Audio was requested but failed - not falling back to video-only');
          throw new Error('Failed to get camera stream with audio. Please check your microphone permissions and try again.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error getting camera stream:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Camera initialization timed out. Please close other apps using the camera and try again.');
      } else if (error.name === 'NotAllowedError') {
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
 * Take a photo using HTML5 Canvas approach (avoids native camera UI)
 * This captures a frame from the current video stream
 */
export async function takePhoto(facingMode: 'user' | 'environment' = 'environment') {
  try {
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