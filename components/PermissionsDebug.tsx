'use client';

import { usePermissions } from '../hooks/usePermissions';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Camera, Image, Mic, Smartphone, Globe } from 'lucide-react';

export function PermissionsDebug() {
  const {
    permissions,
    loading,
    isNative,
    checkPermissions,
    requestCameraPermissions,
    ensureCameraPermissions
  } = usePermissions();

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Checking Permissions...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isNative ? <Smartphone className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
          App Permissions
        </CardTitle>
        <CardDescription>
          Platform: {isNative ? 'Native Mobile' : 'Web Browser'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>Camera</span>
            </div>
            <Badge variant={permissions.camera ? 'default' : 'destructive'}>
              {permissions.camera ? 'Granted' : 'Denied'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span>Photos</span>
            </div>
            <Badge variant={permissions.photos ? 'default' : 'destructive'}>
              {permissions.photos ? 'Granted' : 'Denied'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span>Microphone</span>
            </div>
            <Badge variant={permissions.microphone ? 'default' : 'destructive'}>
              {permissions.microphone ? 'Granted' : 'Denied'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={checkPermissions} 
            variant="outline" 
            className="w-full"
          >
            Refresh Status
          </Button>
          
          {isNative && (
            <>
              <Button 
                onClick={requestCameraPermissions} 
                variant="default" 
                className="w-full"
              >
                Request Camera Permissions
              </Button>
              
              <Button 
                onClick={ensureCameraPermissions} 
                variant="secondary" 
                className="w-full"
              >
                Ensure Camera Access
              </Button>
            </>
          )}
        </div>

        {isNative && (!permissions.camera || !permissions.photos) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Some permissions are missing. If the request button doesn't work, 
              please go to your device Settings → Apps → MirroSocial → Permissions 
              and enable Camera and Storage access manually.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}