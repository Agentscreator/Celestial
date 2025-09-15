'use client';

import { useState } from 'react';
import { requestCameraPermissions, requestMicrophonePermissions } from '@/utils/camera';

export default function TestPermissions() {
  const [status, setStatus] = useState<string>('');

  const testCameraPermissions = async () => {
    setStatus('Requesting camera permissions...');
    try {
      const result = await requestCameraPermissions();
      setStatus(result.granted ? '✅ Camera permissions granted!' : `❌ ${result.message}`);
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    }
  };

  const testMicrophonePermissions = async () => {
    setStatus('Requesting microphone permissions...');
    try {
      const result = await requestMicrophonePermissions();
      setStatus(result.granted ? '✅ Microphone permissions granted!' : `❌ ${result.message}`);
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Test Permissions</h2>
      
      <div className="space-y-2">
        <button 
          onClick={testCameraPermissions}
          className="w-full bg-blue-500 text-white p-3 rounded"
        >
          Test Camera Permissions
        </button>
        
        <button 
          onClick={testMicrophonePermissions}
          className="w-full bg-green-500 text-white p-3 rounded"
        >
          Test Microphone Permissions
        </button>
      </div>
      
      {status && (
        <div className="p-3 bg-gray-100 rounded">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}