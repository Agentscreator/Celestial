import { Camera } from '@capacitor/camera';
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
      // Check camera permissions
      const cameraPermissions = await Camera.checkPermissions();
      
      return {
        camera: cameraPermissions.camera === 'granted',
        photos: cameraPermissions.photos === 'granted',
        microphone: true // We'll add microphone check if needed
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
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
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
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
      ? 'Please go to Settings > MirroSocial > Camera and enable camera access to use this feature.'
      : 'Please go to Settings > Apps > MirroSocial > Permissions and enable Camera and Storage permissions to use this feature.';
    
    alert(message);
  }
}