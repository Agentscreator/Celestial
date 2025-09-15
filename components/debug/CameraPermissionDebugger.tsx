"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { toast } from '@/hooks/use-toast';

export function CameraPermissionDebugger() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const openDeviceSettings = () => {
    addLog('=== Opening Device Settings Help ===');
    addLog('');
    addLog('📱 ANDROID USERS:');
    addLog('1. Go to Settings > Apps & notifications');
    addLog('2. Find "MirroSocial" in the app list');
    addLog('3. Tap on MirroSocial');
    addLog('4. Tap "Permissions"');
    addLog('5. Enable "Camera" and "Microphone"');
    addLog('');
    addLog('🍎 iOS USERS:');
    addLog('1. Go to Settings > Privacy & Security');
    addLog('2. Tap "Camera"');
    addLog('3. Find "MirroSocial" and enable it');
    addLog('4. Go back and tap "Microphone"');
    addLog('5. Find "MirroSocial" and enable it');
    addLog('');
    addLog('After enabling permissions, come back and test again!');
    
    toast({
      title: "Settings Instructions",
      description: "Check the debug logs for step-by-step instructions to enable camera permissions",
    });
  };

  const testPlatformInfo = () => {
    addLog('=== Platform Information ===');
    addLog(`Platform: ${Capacitor.getPlatform()}`);
    addLog(`Is Native: ${Capacitor.isNativePlatform()}`);
    addLog(`Is Plugin Available: ${Capacitor.isPluginAvailable('Camera')}`);
  };

  const testNativePermissions = async () => {
    setIsLoading(true);
    addLog('=== Testing Direct getUserMedia Permissions ===');
    
    try {
      addLog('Platform: ' + Capacitor.getPlatform());
      addLog('Testing direct getUserMedia approach...');
      
      // Test camera permission
      try {
        addLog('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        addLog('✅ Camera access granted!');
        addLog(`Video tracks: ${stream.getVideoTracks().length}`);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        addLog('Camera stream stopped');
        
        toast({
          title: "Success",
          description: "Camera access granted!",
        });
      } catch (error) {
        addLog(`❌ Camera access failed: ${error}`);
        
        toast({
          title: "Camera Error",
          description: `Camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
      
      // Test microphone permission
      try {
        addLog('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        addLog('✅ Microphone access granted!');
        addLog(`Audio tracks: ${stream.getAudioTracks().length}`);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        addLog('Microphone stream stopped');
      } catch (error) {
        addLog(`❌ Microphone access failed: ${error}`);
      }
      
    } catch (error) {
      addLog(`❌ Permission test failed: ${error}`);
      console.error('Permission test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testWebPermissions = async () => {
    setIsLoading(true);
    addLog('=== Testing Web Camera Permissions ===');
    
    try {
      // First try to check permissions using Permissions API
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        addLog(`Web permission status: ${permissions.state}`);
      } catch (error) {
        addLog('Permissions API not supported, will test with getUserMedia');
      }

      addLog('Requesting camera access via getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      
      addLog('✅ Web camera access granted!');
      addLog(`Stream tracks: ${stream.getTracks().length}`);
      
      // Stop the stream
      stream.getTracks().forEach(track => {
        addLog(`Stopping track: ${track.kind} (${track.label})`);
        track.stop();
      });
      
      toast({
        title: "Success",
        description: "Web camera access granted!",
      });
    } catch (error) {
      addLog(`❌ Web camera access failed: ${error}`);
      if (error instanceof Error) {
        addLog(`Error name: ${error.name}`);
        addLog(`Error message: ${error.message}`);
      }
      
      toast({
        title: "Camera Error",
        description: `Web camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFullFlow = async () => {
    setIsLoading(true);
    addLog('=== Testing Full Camera Permission Flow ===');
    
    try {
      // Import our camera utilities
      const { getCameraStream } = await import('@/utils/camera');
      
      addLog('Step 1: Getting camera stream (includes permission handling)...');
      const stream = await getCameraStream({
        facingMode: 'user',
        audioEnabled: true
      });
      
      if (stream) {
        addLog('✅ Full camera flow successful!');
        addLog(`Stream tracks: ${stream.getTracks().length}`);
        
        // Log track details
        stream.getTracks().forEach(track => {
          addLog(`Track: ${track.kind} - ${track.label} - enabled: ${track.enabled}`);
        });
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Success",
          description: "Full camera flow completed successfully!",
        });
      } else {
        addLog('❌ Failed to get camera stream');
      }
    } catch (error) {
      addLog(`❌ Full flow failed: ${error}`);
      console.error('Full flow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectCameraFlow = async () => {
    setIsLoading(true);
    addLog('=== Testing Direct Camera Flow ===');
    
    try {
      addLog('Platform: ' + Capacitor.getPlatform());
      addLog('Testing direct camera access with audio+video...');
      
      const constraints = {
        video: {
          width: { ideal: 720, min: 480 },
          height: { ideal: 1280, min: 640 },
          facingMode: 'user'
        },
        audio: true
      };
      
      addLog(`Constraints: ${JSON.stringify(constraints)}`);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        addLog('✅ Direct camera access successful!');
        addLog(`Stream tracks: ${stream.getTracks().length}`);
        
        // Log track details
        stream.getTracks().forEach(track => {
          addLog(`Track: ${track.kind} - ${track.label} - enabled: ${track.enabled}`);
        });
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        addLog('Stream stopped');
        
        toast({
          title: "Success",
          description: "Direct camera access successful!",
        });
      } catch (error) {
        addLog(`❌ Audio+Video failed: ${error}`);
        
        if (error instanceof Error && error.name === 'NotAllowedError') {
          addLog('🔍 Permission denied - this means:');
          addLog('1. Permission dialog was denied by user, OR');
          addLog('2. Permissions need to be enabled in device settings, OR');
          addLog('3. App needs to be rebuilt/reinstalled');
          addLog('');
          addLog('📱 To fix this:');
          addLog('• Go to device Settings > Apps > MirroSocial > Permissions');
          addLog('• Enable Camera and Microphone permissions');
          addLog('• Or try uninstalling and reinstalling the app');
        }
        
        // Try video only
        addLog('Trying video-only...');
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: constraints.video });
          addLog('✅ Video-only access successful!');
          addLog(`Video tracks: ${videoStream.getVideoTracks().length}`);
          
          videoStream.getTracks().forEach(track => track.stop());
          addLog('Video stream stopped');
          
          toast({
            title: "Partial Success",
            description: "Video access works, but audio failed",
          });
        } catch (videoError) {
          addLog(`❌ Video-only also failed: ${videoError}`);
          
          if (videoError instanceof Error && videoError.name === 'NotAllowedError') {
            addLog('');
            addLog('🚨 CAMERA PERMISSION COMPLETELY DENIED');
            addLog('');
            addLog('📋 TROUBLESHOOTING STEPS:');
            addLog('1. Check device settings:');
            addLog('   Settings > Apps > MirroSocial > Permissions > Camera (Enable)');
            addLog('2. Try uninstalling and reinstalling the app');
            addLog('3. Make sure camera works in other apps');
            addLog('4. Restart your device');
            addLog('');
            addLog('If none of these work, there may be a system-level issue.');
          }
          
          throw videoError;
        }
      }
    } catch (error) {
      addLog(`❌ Direct camera flow failed: ${error}`);
      console.error('Direct camera flow error:', error);
      
      let description = 'Direct camera access failed';
      if (error instanceof Error && error.name === 'NotAllowedError') {
        description = 'Permission denied. Check device settings: Apps > MirroSocial > Permissions > Camera';
      }
      
      toast({
        title: "Camera Permission Issue",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Camera Permission Debugger
          <Badge variant="outline">Debug Tool</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testPlatformInfo} variant="outline">
            Platform Info
          </Button>
          <Button 
            onClick={testNativePermissions} 
            disabled={isLoading}
            variant="outline"
          >
            Test Direct Permissions
          </Button>
          <Button 
            onClick={testWebPermissions} 
            disabled={isLoading}
            variant="outline"
          >
            Test Web Permissions
          </Button>
          <Button 
            onClick={testDirectCameraFlow} 
            disabled={isLoading}
            variant="outline"
          >
            Test Direct Camera Flow
          </Button>
          <Button 
            onClick={testFullFlow} 
            disabled={isLoading}
          >
            Test Full Flow
          </Button>
          <Button onClick={clearLogs} variant="ghost">
            Clear Logs
          </Button>
          <Button onClick={openDeviceSettings} variant="outline">
            📱 Settings Help
          </Button>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Debug Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click a test button to start debugging.</p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Platform Info:</strong> Shows what platform you're running on</li>
            <li><strong>Test Direct Permissions:</strong> Tests direct getUserMedia permission requests</li>
            <li><strong>Test Web Permissions:</strong> Tests browser's getUserMedia API</li>
            <li><strong>Test Direct Camera Flow:</strong> Tests direct camera access with fallbacks</li>
            <li><strong>Test Full Flow:</strong> Tests the complete camera permission and stream flow</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}