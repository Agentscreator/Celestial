import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export interface PermissionStatus {
  camera: boolean;
  photos: boolean;
  microphone: boolean;
}

export class PermissionsManager {
  static async checkAllPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      // Web platform - assume permissions are granted
      return {
        camera: true,
        photos: true,
        microphone: true
      };
    }

    try {
      // Check camera permissions using native Capacitor Camera plugin
      const cameraPermissions = await Camera.checkPermissions();
      
      return {
        camera: cameraPermissions.camera === 'granted',
        photos: cameraPermissions.photos === 'granted',
        microphone: true // Microphone is handled through getUserMedia
      };
    } catch (error) {
      console.error('Error checking native permissions:', error);
      return {
        camera: false,
        photos: false,
        microphone: false
      };
    }
  }

  static async requestCameraPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      
      // Request permissions using native Capacitor Camera plugin
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      
      
      const granted = permissions.camera === 'granted' && permissions.photos === 'granted';
      
      if (!granted) {
        
        // Try to trigger permission by attempting to use camera
        try {
          await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            saveToGallery: false
          });
          
          // If we get here, permissions were granted
          return true;
        } catch (cameraError) {
          return false;
        }
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting native camera permissions:', error);
      return false;
    }
  }

  static async requestMicrophonePermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      
      // Use getUserMedia to trigger native microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Error requesting microphone permissions:', error);
      return false;
    }
  }

  static async ensureCameraPermissions(): Promise<boolean> {
    const currentPermissions = await this.checkAllPermissions();
    
    if (currentPermissions.camera && currentPermissions.photos) {
      return true;
    }

    // Request permissions if not granted
    return await this.requestCameraPermissions();
  }

  static async initializeAllPermissions(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      
      // Request camera permissions first
      await this.requestCameraPermissions();
      
      // Request microphone permissions
      await this.requestMicrophonePermissions();
      
    } catch (error) {
      console.error('Error during permission initialization:', error);
    }
  }

  static async getDeviceInfo() {
    try {
      const info = await Device.getInfo();
      return info;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }

  static showPermissionAlert(platform: string) {
    const message = platform === 'ios' 
      ? 'Please go to Settings > MirroSocial and enable Camera and Photos access to use this feature.'
      : 'Please go to Settings > Apps > MirroSocial > Permissions and enable Camera, Microphone, and Storage permissions to use this feature.';
    
    alert(message);
  }
}