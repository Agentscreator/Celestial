import { useState, useEffect } from 'react';
import { PermissionsManager, PermissionStatus } from '../utils/permissions';
import { Capacitor } from '@capacitor/core';

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
      const status = await PermissionsManager.checkAllPermissions();
      setPermissions(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsManager.requestCameraPermissions();
      if (granted) {
        await checkPermissions(); // Refresh permissions status
      }
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const ensureCameraPermissions = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsManager.ensureCameraPermissions();
      if (granted) {
        await checkPermissions(); // Refresh permissions status
      } else if (isNative) {
        // Show alert to go to settings
        const deviceInfo = await PermissionsManager.getDeviceInfo();
        PermissionsManager.showPermissionAlert(deviceInfo?.platform || 'unknown');
      }
      return granted;
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