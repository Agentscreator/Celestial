"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { requestCameraPermissions, checkCameraPermissions, requestMicrophonePermissions } from '@/utils/camera';
import { Capacitor } from '@capacitor/core';

interface PermissionStatus {
  camera: 'unknown' | 'granted' | 'denied' | 'loading';
  microphone: 'unknown' | 'granted' | 'denied' | 'loading';
}

export function PermissionTester() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'unknown',
    microphone: 'unknown'
  });

  const checkCameraPermission = async () => {
    setPermissions(prev => ({ ...prev, camera: 'loading' }));
    
    try {
      const result = await checkCameraPermissions();
      setPermissions(prev => ({ 
        ...prev, 
        camera: result.granted ? 'granted' : 'denied' 
      }));
      
      if (!result.granted && result.message) {
        toast({
          title: "Camera Permission",
          description: result.message,
          variant: "default",
        });
      }
    } catch (error) {
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      console.error('Error checking camera permission:', error);
    }
  };

  const requestCameraPermission = async () => {
    setPermissions(prev => ({ ...prev, camera: 'loading' }));
    
    try {
      const result = await requestCameraPermissions();
      setPermissions(prev => ({ 
        ...prev, 
        camera: result.granted ? 'granted' : 'denied' 
      }));
      
      if (result.granted) {
        toast({
          title: "Success!",
          description: "Camera permissions granted. Check your device settings to see the permissions.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: result.message || "Camera permission was denied. Please enable it in your device settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      console.error('Error requesting camera permission:', error);
      toast({
        title: "Error",
        description: "Failed to request camera permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requestMicrophonePermission = async () => {
    setPermissions(prev => ({ ...prev, microphone: 'loading' }));
    
    try {
      const result = await requestMicrophonePermissions();
      setPermissions(prev => ({ 
        ...prev, 
        microphone: result.granted ? 'granted' : 'denied' 
      }));
      
      if (result.granted) {
        toast({
          title: "Success!",
          description: "Microphone permissions granted.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: result.message || "Microphone permission was denied.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      console.error('Error requesting microphone permission:', error);
    }
  };

  const openDeviceSettings = () => {
    const platform = Capacitor.getPlatform();
    let message = "Please go to your device settings to manage app permissions.";
    
    if (platform === 'ios') {
      message = "Go to Settings > Privacy & Security > Camera/Microphone > MirroSocial to enable permissions.";
    } else if (platform === 'android') {
      message = "Go to Settings > Apps > MirroSocial > Permissions to enable camera and microphone access.";
    }
    
    toast({
      title: "Device Settings",
      description: message,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'loading':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Permission Tester</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Platform: <span className="font-medium">{Capacitor.getPlatform()}</span>
          {Capacitor.isNativePlatform() && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              Native App
            </span>
          )}
        </div>

        {/* Camera Permission */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <span className="font-medium">Camera</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(permissions.camera)}
              <span className="text-sm">{getStatusText(permissions.camera)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={checkCameraPermission}
              variant="outline" 
              size="sm"
              disabled={permissions.camera === 'loading'}
            >
              Check
            </Button>
            <Button 
              onClick={requestCameraPermission}
              size="sm"
              disabled={permissions.camera === 'loading'}
            >
              Request
            </Button>
          </div>
        </div>

        {/* Microphone Permission */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              <span className="font-medium">Microphone</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(permissions.microphone)}
              <span className="text-sm">{getStatusText(permissions.microphone)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={requestMicrophonePermission}
              size="sm"
              disabled={permissions.microphone === 'loading'}
            >
              Request
            </Button>
          </div>
        </div>

        {/* Device Settings */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Device Settings</span>
          </div>
          <Button 
            onClick={openDeviceSettings}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Open Settings Guide
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Click "Request" to trigger permission dialogs</li>
            <li>2. Allow permissions when prompted</li>
            <li>3. Check your device settings to verify</li>
            <li>4. If denied, use "Open Settings Guide"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}