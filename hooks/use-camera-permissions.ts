import { useState, useCallback } from 'react';
import { requestCameraPermissions, checkCameraPermissions, getCameraStream } from '@/utils/camera';
import { toast } from '@/hooks/use-toast';

export interface UseCameraPermissionsReturn {
  hasPermission: boolean | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<boolean>;
  getCameraStreamWithPermission: (options: { facingMode: 'user' | 'environment'; audioEnabled: boolean }) => Promise<MediaStream | null>;
}

export function useCameraPermissions(): UseCameraPermissionsReturn {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await requestCameraPermissions();
      setHasPermission(result.granted);
      
      if (!result.granted && result.message) {
        toast({
          title: "Camera Permission Required",
          description: result.message,
          variant: "destructive",
        });
      }
      
      return result.granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      toast({
        title: "Permission Error",
        description: "Failed to request camera permission. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await checkCameraPermissions();
      setHasPermission(result.granted);
      return result.granted;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const getCameraStreamWithPermission = useCallback(async (options: { facingMode: 'user' | 'environment'; audioEnabled: boolean }): Promise<MediaStream | null> => {
    try {
      console.log('🔐 Getting camera stream with permission check...');
      
      // First ensure we have permission
      let hasPermissionNow = hasPermission;
      
      // If we don't know the permission status, check it first
      if (hasPermissionNow === null) {
        console.log('❓ Permission status unknown, checking...');
        hasPermissionNow = await checkPermission();
      }
      
      // If we don't have permission, request it
      if (!hasPermissionNow) {
        console.log('🚫 No permission, requesting...');
        hasPermissionNow = await requestPermission();
      }
      
      if (!hasPermissionNow) {
        console.log('❌ Permission denied');
        return null;
      }

      console.log('✅ Permission granted, getting camera stream...');
      
      // Get the camera stream with retry logic for iOS
      let stream: MediaStream | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!stream && retryCount < maxRetries) {
        try {
          stream = await getCameraStream(options);
          if (stream) {
            console.log('✅ Camera stream obtained on attempt', retryCount + 1);
            break;
          }
        } catch (error) {
          retryCount++;
          console.log(`❌ Camera stream attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying in 1 second... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }
      
      return stream;
    } catch (error) {
      console.error('❌ Error getting camera stream:', error);
      
      let errorMessage = "Failed to access camera. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('denied') || error.message.includes('permission')) {
          errorMessage = "Camera permission denied. Please allow camera access in your device settings.";
          setHasPermission(false); // Update permission state
        } else if (error.message.includes('timeout')) {
          errorMessage = "Camera is taking too long to start. Please close other apps using the camera and try again.";
        } else if (error.message.includes('already in use')) {
          errorMessage = "Camera is already in use by another app. Please close other apps and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [hasPermission, requestPermission, checkPermission]);

  return {
    hasPermission,
    isLoading,
    requestPermission,
    checkPermission,
    getCameraStreamWithPermission,
  };
}