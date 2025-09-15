'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, Mic, Image, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionsOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PermissionsOnboarding({ isOpen, onClose, onComplete }: PermissionsOnboardingProps) {
  const { permissions, requestCameraPermissions, ensureCameraPermissions, isNative } = usePermissions();
  const [step, setStep] = useState<'intro' | 'requesting' | 'complete' | 'manual'>('intro');
  const [requestedPermissions, setRequestedPermissions] = useState(false);

  const handleRequestPermissions = async () => {
    setStep('requesting');
    
    try {
      const granted = await requestCameraPermissions();
      
      if (granted) {
        setStep('complete');
        setTimeout(() => {
          onComplete();
          onClose();
        }, 2000);
      } else {
        setStep('manual');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setStep('manual');
    }
    
    setRequestedPermissions(true);
  };

  const handleManualSetup = () => {
    onComplete();
    onClose();
  };

  if (!isNative) {
    // Don't show onboarding for web
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Permissions
          </DialogTitle>
          <DialogDescription>
            MirroSocial needs access to your device features to work properly
          </DialogDescription>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Camera className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Camera Access</p>
                  <p className="text-sm text-blue-700">Record and share videos with friends</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Mic className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Microphone Access</p>
                  <p className="text-sm text-green-700">Record audio for your videos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Image className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Photo Library</p>
                  <p className="text-sm text-purple-700">Save and share your content</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRequestPermissions} className="flex-1">
                Grant Permissions
              </Button>
              <Button variant="outline" onClick={onClose}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {step === 'requesting' && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium mb-2">Requesting Permissions</p>
            <p className="text-sm text-gray-600">
              Please allow access when prompted by your device
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">All Set!</p>
            <p className="text-sm text-gray-600">
              Permissions granted successfully. You can now use all app features.
            </p>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 mb-1">Manual Setup Required</p>
                <p className="text-sm text-yellow-800">
                  Some permissions need to be enabled manually in your device settings.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">To enable permissions:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                <li>Go to Settings → Apps → MirroSocial</li>
                <li>Tap on "Permissions"</li>
                <li>Enable Camera, Microphone, and Storage</li>
                <li>Return to the app</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleManualSetup} className="flex-1">
                I'll Set It Up
              </Button>
              <Button variant="outline" onClick={() => setStep('intro')}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage onboarding state
export function usePermissionsOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isNative } = usePermissions();

  useEffect(() => {
    if (!isNative) return;

    const hasSeenOnboarding = localStorage.getItem('permissions-onboarding-seen');
    
    if (!hasSeenOnboarding) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isNative]);

  const handleComplete = () => {
    localStorage.setItem('permissions-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  const handleClose = () => {
    localStorage.setItem('permissions-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    handleComplete,
    handleClose
  };
}