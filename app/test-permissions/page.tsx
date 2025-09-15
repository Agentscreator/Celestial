import { PermissionTester } from '@/components/PermissionTester';

export default function TestPermissionsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">Camera & Microphone Permission Test</h1>
        <PermissionTester />
      </div>
    </div>
  );
}