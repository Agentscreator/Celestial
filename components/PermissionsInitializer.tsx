'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PermissionsManager } from '../utils/permissions';

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
        
        // Check if we've already initialized permissions this session
        const hasInitialized = sessionStorage.getItem('permissions-initialized');
        
        if (!hasInitialized) {
          console.log('First time app launch this session - requesting native permissions...');
          
          // Use the native permission manager to initialize all permissions
          await PermissionsManager.initializeAllPermissions();
          
          // Mark as initialized for this session
          sessionStorage.setItem('permissions-initialized', 'true');
          
          console.log('✅ Native permissions initialization complete');
        } else {
          console.log('Permissions already initialized this session');
        }
        
      } catch (error) {
        console.error('Error initializing native permissions:', error);
      } finally {
        setInitialized(true);
      }
    };

    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(initializePermissions, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything visible
  return null;
}