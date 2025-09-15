import { PermissionsDebug } from '../../components/PermissionsDebug';

export default function PermissionsTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Permissions Test</h1>
          <p className="text-gray-600">
            Use this page to test and debug app permissions on native platforms.
          </p>
        </div>
        
        <PermissionsDebug />
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Fix Missing Permissions:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Android:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Go to Settings → Apps → MirroSocial</li>
              <li>Tap on "Permissions"</li>
              <li>Enable Camera, Microphone, and Storage permissions</li>
            </ol>
            
            <p className="mt-3"><strong>iOS:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Go to Settings → MirroSocial</li>
              <li>Enable Camera and Photos permissions</li>
              <li>Enable Microphone if needed</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}