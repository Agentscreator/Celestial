import { CameraPermissionDebugger } from '@/components/debug/CameraPermissionDebugger';

export default function DebugCameraPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Camera Permission Debug</h1>
      <CameraPermissionDebugger />
    </div>
  );
}