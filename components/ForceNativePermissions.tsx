'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

export function ForceNativePermissions() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const forceNativePermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Not on Native Platform",
        description: "This test only works on native mobile apps",
        variant: "destructive"
      });
      return;
    }

    setIsRequesting(true);
    setResults([]);
    addResult('Starting native permission requests...');

    try {
      // Method 1: Request permissions directly
      addResult('Method 1: Requesting permissions via Camera.requestPermissions()');
      try {
        const permissions = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        addResult(`Permission result: camera=${permissions.camera}, photos=${permissions.photos}`);
      } catch (error) {
        addResult(`Method 1 failed: ${error}`);
      }

      // Method 2: Force permission by trying to use camera
      addResult('Method 2: Forcing permission by attempting camera usage');
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          saveToGallery: false
        });
        addResult('✅ Camera access successful - permissions should now be in Settings');
      } catch (error) {
        addResult(`Method 2 failed: ${error}`);
      }

      // Method 3: Force microphone permission
      addResult('Method 3: Forcing microphone permission via getUserMedia');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        addResult('✅ Microphone access successful');
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        addResult(`Method 3 failed: ${error}`);
      }

      // Check final permission status
      addResult('Checking final permission status...');
      try {
        const finalPermissions = await Camera.checkPermissions();
        addResult(`Final status: camera=${finalPermissions.camera}, photos=${finalPermissions.photos}`);
      } catch (error) {
        addResult(`Status check failed: ${error}`);
      }

      addResult('🎉 Permission request process complete! Check your device Settings now.');
      
      toast({
        title: "Permission Requests Complete",
        description: "Check Settings > Apps > MirroSocial > Permissions",
      });

    } catch (error) {
      addResult(`❌ Error: ${error}`);
      toast({
        title: "Error",
        description: "Failed to request permissions",
        variant: "destructive"
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (!Capacitor.isNativePlatform()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Native Permissions Test</CardTitle>
          <CardDescription>This test only works on native mobile platforms</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Force Native Permission Requests</CardTitle>
        <CardDescription>
          This will force the app to request native permissions that should appear in device Settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={forceNativePermissions} 
          disabled={isRequesting}
          className="w-full"
        >
          {isRequesting ? 'Requesting Permissions...' : 'Force Native Permission Requests'}
        </Button>

        {results.length > 0 && (
          <div className="bg-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-2">Results:</h4>
            <div className="space-y-1 text-sm font-mono">
              {results.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>After running this test:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to your device Settings</li>
            <li>Find "Apps" or "Application Manager"</li>
            <li>Look for "MirroSocial"</li>
            <li>Tap on it and look for "Permissions"</li>
            <li>You should now see Camera, Microphone, and Storage permissions</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}