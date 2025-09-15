'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PermissionsManager } from '../utils/permissions';
import { requestCameraPermissions, requestMicrophonePermissions } from '../utils/camera';

export function PermissionsInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializePermissions = async () => {
      // Only run on native platforms
      if (!Capacitor.isNativePlatform()) {
        setInitialized(true);
        return;
      }

      try {
        console.log('Initializing native app permissions...');
        
        // Check if we've already initialized permissions
        const hasInitialized = localStorage.getItem('permissions-initialized');
        
        if (!hasInitialized) {
          console.log('First time app launch - requesting permissions...');
          
          // Request camera permissions (this will make them appear in Settings)
          const cameraResult = await requestCameraPermissions();
          console.log('Camera permission result:', cameraResult);
          
          // Request microphone permissions
          const micResult = await requestMicrophonePermissions();
          console.log('Microphone permission result:', micResult);
          
          // Mark as initialized so we don't ask again
          localStorage.setItem('permissions-initialized', 'true');
          
          console.log('✅ Permissions initialization complete');
        } else {
          console.log('Permissions already initialized previously');
        }
        
      } catch (error) {
        console.error('Error initializing permissions:', error);
      } finally {
        setInitialized(true);
      }
    };

    initializePermissions();
  }, []);

  // This component doesn't render anything visible
  return null;
}