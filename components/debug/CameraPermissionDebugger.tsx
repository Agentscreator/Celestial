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

  const testPlatformInfo = () => {
    addLog('=== Platform Information ===');
    addLog(`Platform: ${Capacitor.getPlatform()}`);
    addLog(`Is Native: ${Capacitor.isNativePlatform()}`);
    addLog(`Is Plugin Available: ${Capacitor.isPluginAvailable('Camera')}`);
  };

  const testNativePermissions = async () => {
    setIsLoading(true);
    addLog('=== Testing Native Camera Permissions ===');
    
    try {
      if (!Capacitor.isNativePlatform()) {
        addLog('Not on native platform, skipping native permission test');
        return;
      }

      addLog('Checking current permissions...');
      const currentPermissions = await Camera.checkPermissions();
      addLog(`Current permissions: ${JSON.stringify(currentPermissions)}`);

      if (currentPermissions.camera !== 'granted') {
        addLog('Requesting camera permissions...');
        const requestResult = await Camera.requestPermissions();
        addLog(`Permission request result: ${JSON.stringify(requestResult)}`);
        
        if (requestResult.camera === 'granted') {
          addLog('✅ Native camera permission granted!');
          toast({
            title: "Success",
            description: "Native camera permission granted!",
          });
        } else {
          addLog('❌ Native camera permission denied');
          toast({
            title: "Permission Denied",
            description: "Native camera permission was denied",
            variant: "destructive",
          });
        }
      } else {
        addLog('✅ Native camera permission already granted!');
      }
    } catch (error) {
      addLog(`❌ Native permission test failed: ${error}`);
      console.error('Native permission test error:', error);
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

  const testNativeFlow = async () => {
    setIsLoading(true);
    addLog('=== Testing Native Camera Flow ===');
    
    try {
      const { setupNativeCamera } = await import('@/utils/native-permissions');
      
      addLog('Testing native camera setup...');
      const result = await setupNativeCamera({
        facingMode: 'user',
        audioEnabled: true
      });
      
      if (result.stream) {
        addLog('✅ Native camera setup successful!');
        addLog(`Stream tracks: ${result.stream.getTracks().length}`);
        
        // Log track details
        result.stream.getTracks().forEach(track => {
          addLog(`Track: ${track.kind} - ${track.label} - enabled: ${track.enabled}`);
        });
        
        // Stop the stream
        result.stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Success",
          description: "Native camera setup successful!",
        });
      } else {
        addLog(`❌ Native camera setup failed: ${result.error}`);
        toast({
          title: "Native Camera Error",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      addLog(`❌ Native flow failed: ${error}`);
      console.error('Native flow error:', error);
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
            Test Native Permissions
          </Button>
          <Button 
            onClick={testWebPermissions} 
            disabled={isLoading}
            variant="outline"
          >
            Test Web Permissions
          </Button>
          <Button 
            onClick={testNativeFlow} 
            disabled={isLoading}
            variant="outline"
          >
            Test Native Flow
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
            <li><strong>Test Native Permissions:</strong> Tests Capacitor's native permission system</li>
            <li><strong>Test Web Permissions:</strong> Tests browser's getUserMedia API</li>
            <li><strong>Test Native Flow:</strong> Tests the comprehensive native camera setup</li>
            <li><strong>Test Full Flow:</strong> Tests the complete camera permission and stream flow</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}