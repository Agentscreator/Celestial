import { useState, useEffect } from 'react';
import { requestCameraPermissions as requestCamera, checkCameraPermissions, requestMicrophonePermissions } from '../utils/camera';
import { Capacitor } from '@capacitor/core';

export interface PermissionStatus {
  camera: boolean;
  photos: boolean;
  microphone: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    photos: false,
    microphone: false
  });
  const [loading, setLoading] = useState(true);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setLoading(true);
    try {
      // Check camera permissions using the updated utilities
      const cameraResult = await checkCameraPermissions();
      
      // For now, assume photos permission is the same as camera
      // and we can't easily check microphone permission status
      setPermissions({
        camera: cameraResult.granted,
        photos: cameraResult.granted,
        microphone: false // We can't easily check this without requesting
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions({
        camera: false,
        photos: false,
        microphone: false
      });
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      const result = await requestCamera();
      if (result.granted) {
        await checkPermissions(); // Refresh permissions status
      }
      return result.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const ensureCameraPermissions = async (): Promise<boolean> => {
    try {
      // First check if we already have permissions
      const checkResult = await checkCameraPermissions();
      if (checkResult.granted) {
        return true;
      }

      // If not, request them
      const requestResult = await requestCamera();
      if (requestResult.granted) {
        await checkPermissions(); // Refresh permissions status
        return true;
      }

      // If still not granted and on native platform, show alert
      if (isNative) {
        alert('Camera permissions are required. Please enable them in your device Settings → Apps → MirroSocial → Permissions.');
      }
      
      return false;
    } catch (error) {
      console.error('Error ensuring permissions:', error);
      return false;
    }
  };

  return {
    permissions,
    loading,
    isNative,
    checkPermissions,
    requestCameraPermissions,
    ensureCameraPermissions
  };
}