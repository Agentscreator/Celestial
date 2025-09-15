'use client';

import { PermissionsInitializer } from './PermissionsInitializer';
import { PermissionsOnboarding, usePermissionsOnboarding } from './PermissionsOnboarding';

export function AppPermissionsProvider({ children }: { children: React.ReactNode }) {
  const { showOnboarding, handleComplete, handleClose } = usePermissionsOnboarding();

  return (
    <>
      {/* Initialize permissions silently in the background */}
      <PermissionsInitializer />
      
      {/* Show onboarding dialog when needed */}
      <PermissionsOnboarding
        isOpen={showOnboarding}
        onComplete={handleComplete}
        onClose={handleClose}
      />
      
      {children}
    </>
  );
}